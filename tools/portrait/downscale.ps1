# Crops a square from the photo, downsamples it and writes "r,g,b" per pixel, row-major.
param([string]$Src, [string]$Out, [int]$X, [int]$Y, [int]$Size, [int]$W, [int]$H)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($Src)
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$dest = New-Object System.Drawing.Rectangle 0, 0, $W, $H
$srcRect = New-Object System.Drawing.Rectangle $X, $Y, $Size, ([int]($Size * $H / $W))
$g.DrawImage($img, $dest, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$lines = for ($py = 0; $py -lt $H; $py++) {
  ($(for ($px = 0; $px -lt $W; $px++) { $c = $bmp.GetPixel($px, $py); "$($c.R),$($c.G),$($c.B)" }) -join ' ')
}
Set-Content -Path $Out -Value $lines -Encoding ascii
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
