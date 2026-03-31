<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class ImageOptimizer
{
    /**
     * Optimise et upload une image sur S3.
     *
     * @param  UploadedFile  $file
     * @param  string  $directory  (covers, thumbnails)
     * @param  int  $maxWidth
     * @param  int  $quality  (1-100)
     * @return string  Le path stocké sur S3
     */
    public static function optimizeAndUpload(
        UploadedFile $file,
        string $directory,
        int $maxWidth = 1280,
        int $quality = 80,
    ): string {
        $image = Image::read($file);

        // Redimensionner si plus large que maxWidth (garde le ratio)
        if ($image->width() > $maxWidth) {
            $image->scaleDown(width: $maxWidth);
        }

        // Encoder en WebP pour un poids minimal
        $encoded = $image->toWebp($quality);

        // Générer un nom de fichier unique
        $filename = $directory . '/' . ulid() . '.webp';

        // Upload sur S3
        Storage::disk('s3')->put($filename, (string) $encoded, 'public');

        return $filename;
    }
}
