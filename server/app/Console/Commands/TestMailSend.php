<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestMailSend extends Command
{
    protected $signature = 'mail:test {email} {--queue : Send via queue instead of sync}';

    protected $description = 'Test email sending - sync or queued';

    public function handle(): int
    {
        $email = $this->argument('email');
        $useQueue = $this->option('queue');

        $this->info('=== Mail Config ===');
        $this->info('MAIL_MAILER: ' . config('mail.default'));
        $this->info('MAIL_FROM: ' . config('mail.from.address') . ' <' . config('mail.from.name') . '>');
        $this->info('RESEND_KEY: ' . (config('services.resend.key') ? substr(config('services.resend.key'), 0, 10) . '...' : 'NOT SET'));
        $this->info('QUEUE_CONNECTION: ' . config('queue.default'));
        $this->info('');

        // Test 1: Sync send (direct, pas de queue)
        $this->info("=== Test: Sending to {$email} " . ($useQueue ? 'via QUEUE' : 'SYNC') . ' ===');

        try {
            $mailable = new \Illuminate\Mail\Mailable();

            if ($useQueue) {
                Mail::to($email)->queue(
                    new TestMailable()
                );
                $this->info('✅ Mail queued successfully. Check worker logs.');
            } else {
                Mail::to($email)->send(
                    new TestMailable()
                );
                $this->info('✅ Mail sent successfully (sync)!');
            }
        } catch (\Exception $e) {
            $this->error('❌ FAILED: ' . $e->getMessage());
            $this->error('File: ' . $e->getFile() . ':' . $e->getLine());
            $this->newLine();
            $this->error('Trace:');
            $this->line($e->getTraceAsString());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}

class TestMailable extends \Illuminate\Mail\Mailable
{
    public function build()
    {
        return $this
            ->subject('Test Sellit - ' . now()->format('H:i:s'))
            ->html('<h1>Test Email</h1><p>If you see this, Resend is working!</p><p>Sent at: ' . now()->toDateTimeString() . '</p>');
    }
}
