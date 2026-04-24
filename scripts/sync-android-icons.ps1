param(
  [Parameter(Mandatory = $true)]
  [string]$SourceIcon,

  [Parameter(Mandatory = $true)]
  [string]$ResourcesDir
)

Set-StrictMode -Version 3.0
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function Save-ScaledBitmap {
  param(
    [Parameter(Mandatory = $true)]
    [System.Drawing.Bitmap]$SourceBitmap,

    [Parameter(Mandatory = $true)]
    [string]$TargetPath,

    [Parameter(Mandatory = $true)]
    [int]$CanvasSize,

    [double]$InsetRatio = 0,

    [switch]$RoundMask
  )

  $bitmap = New-Object System.Drawing.Bitmap($CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

  try {
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

      $inset = [int][Math]::Round($CanvasSize * $InsetRatio)
      $drawArea = [Math]::Max(1, $CanvasSize - ($inset * 2))
      $scale = [Math]::Min($drawArea / $SourceBitmap.Width, $drawArea / $SourceBitmap.Height)
      $targetWidth = [Math]::Max(1, [int][Math]::Round($SourceBitmap.Width * $scale))
      $targetHeight = [Math]::Max(1, [int][Math]::Round($SourceBitmap.Height * $scale))
      $targetX = [int][Math]::Floor(($CanvasSize - $targetWidth) / 2)
      $targetY = [int][Math]::Floor(($CanvasSize - $targetHeight) / 2)

      if ($RoundMask) {
        $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath

        try {
          $clipPath.AddEllipse(0, 0, $CanvasSize - 1, $CanvasSize - 1)
          $graphics.SetClip($clipPath)
          $graphics.DrawImage($SourceBitmap, $targetX, $targetY, $targetWidth, $targetHeight)
          $graphics.ResetClip()
        } finally {
          $clipPath.Dispose()
        }
      } else {
        $graphics.DrawImage($SourceBitmap, $targetX, $targetY, $targetWidth, $targetHeight)
      }
    } finally {
      $graphics.Dispose()
    }

    $bitmap.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $bitmap.Dispose()
  }
}

$sourcePath = [System.IO.Path]::GetFullPath($SourceIcon)
$resourcesPath = [System.IO.Path]::GetFullPath($ResourcesDir)

if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
  throw "Source icon not found: $sourcePath"
}

if (-not (Test-Path -LiteralPath $resourcesPath -PathType Container)) {
  throw "Android resources directory not found: $resourcesPath"
}

$densitySpecs = @(
  @{ Directory = "mipmap-mdpi"; LegacySize = 48; ForegroundSize = 108 },
  @{ Directory = "mipmap-hdpi"; LegacySize = 72; ForegroundSize = 162 },
  @{ Directory = "mipmap-xhdpi"; LegacySize = 96; ForegroundSize = 216 },
  @{ Directory = "mipmap-xxhdpi"; LegacySize = 144; ForegroundSize = 324 },
  @{ Directory = "mipmap-xxxhdpi"; LegacySize = 192; ForegroundSize = 432 }
)

$stream = [System.IO.File]::Open($sourcePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)

try {
  $icon = New-Object System.Drawing.Icon($stream, 256, 256)

  try {
    $sourceBitmap = $icon.ToBitmap()

    try {
      foreach ($spec in $densitySpecs) {
        $targetDirectory = Join-Path $resourcesPath $spec.Directory

        if (-not (Test-Path -LiteralPath $targetDirectory)) {
          New-Item -ItemType Directory -Path $targetDirectory | Out-Null
        }

        Save-ScaledBitmap -SourceBitmap $sourceBitmap -TargetPath (Join-Path $targetDirectory "ic_launcher.png") -CanvasSize $spec.LegacySize
        Save-ScaledBitmap -SourceBitmap $sourceBitmap -TargetPath (Join-Path $targetDirectory "ic_launcher_round.png") -CanvasSize $spec.LegacySize -RoundMask
        Save-ScaledBitmap -SourceBitmap $sourceBitmap -TargetPath (Join-Path $targetDirectory "ic_launcher_foreground.png") -CanvasSize $spec.ForegroundSize -InsetRatio 0.18
      }
    } finally {
      $sourceBitmap.Dispose()
    }
  } finally {
    $icon.Dispose()
  }
} finally {
  $stream.Dispose()
}
