<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\Laravel\Facades\Image;

class ImageOptimizer
{
    public static function optimizeAndUpload(
        $file,
        string $directory,
        int $maxWidth = 1280,
        int $quality = 80,
    ): string {
        // Supporter TemporaryUploadedFile (Livewire) et UploadedFile standard
        if ($file instanceof \Livewire\Features\SupportFileUploads\TemporaryUploadedFile) {
            $content = $file->get();
        } elseif (method_exists($file, 'getContent')) {
            $content = $file->getContent();
        } else {
            $content = file_get_contents($file->getRealPath());
        }

        $image = Image::decode($content);

        if ($image->width() > $maxWidth) {
            $image->scaleDown(width: $maxWidth);
        }

        $encoded = $image->encode(new WebpEncoder(quality: $quality));

        $filename = $directory . '/' . Str::ulid() . '.webp';

        Storage::disk('s3')->put($filename, (string) $encoded, 'public');

        return $filename;
    }
}
