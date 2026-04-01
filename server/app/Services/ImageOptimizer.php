<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\Laravel\Facades\Image;

class ImageOptimizer
{
    public static function optimizeAndUpload(
        UploadedFile $file,
        string $directory,
        int $maxWidth = 1280,
        int $quality = 80,
    ): string {
        $image = Image::decode($file->getContent());

        if ($image->width() > $maxWidth) {
            $image->scaleDown(width: $maxWidth);
        }

        $encoded = $image->encode(new WebpEncoder(quality: $quality));

        $filename = $directory . '/' . \Illuminate\Support\Str::ulid() . '.webp';

        Storage::disk('s3')->put($filename, (string) $encoded, 'public');

        return $filename;
    }
}
