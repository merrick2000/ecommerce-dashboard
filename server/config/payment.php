<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Providers actifs (dans l'ordre de priorité)
    |--------------------------------------------------------------------------
    */
    'providers' => ['feexpay', 'fedapay', 'paydunya', 'pawapay'],

    /*
    |--------------------------------------------------------------------------
    | Identifiants par provider
    |--------------------------------------------------------------------------
    */
    'feexpay' => [
        'api_key' => env('FEEXPAY_API_KEY'),
        'shop_id' => env('FEEXPAY_SHOP_ID'),
        'base_url' => env('FEEXPAY_BASE_URL', 'https://api.feexpay.me/api'),
        'callback_url' => env('FEEXPAY_CALLBACK_URL'),
    ],

    'fedapay' => [
        'api_key' => env('FEDAPAY_API_KEY'),
        'base_url' => env('FEDAPAY_BASE_URL', 'https://sandbox-api.fedapay.com/v1'),
        'webhook_secret' => env('FEDAPAY_WEBHOOK_SECRET'),
    ],

    'paydunya' => [
        'master_key' => env('PAYDUNYA_MASTER_KEY'),
        'public_key' => env('PAYDUNYA_PUBLIC_KEY'),
        'private_key' => env('PAYDUNYA_PRIVATE_KEY'),
        'token' => env('PAYDUNYA_TOKEN'),
        'base_url' => env('PAYDUNYA_BASE_URL', 'https://app.paydunya.com/sandbox-api/v1'),
    ],

    'pawapay' => [
        'api_key' => env('PAWAPAY_API_KEY'),
        'base_url' => env('PAWAPAY_BASE_URL', 'https://api.sandbox.pawapay.cloud'),
        'signing_key' => env('PAWAPAY_SIGNING_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Matrice pays → réseaux supportés par provider
    |--------------------------------------------------------------------------
    | Format : 'COUNTRY_CODE' => ['network' => ['provider1', 'provider2', ...]]
    | L'ordre détermine la priorité (fallback automatique).
    |--------------------------------------------------------------------------
    */
    'routing' => [
        'BJ' => [ // Bénin
            'mtn' => ['feexpay', 'fedapay', 'paydunya', 'pawapay'],
            'moov' => ['feexpay', 'fedapay', 'paydunya', 'pawapay'],
            'celtiis' => ['feexpay'],
        ],
        'TG' => [ // Togo
            'tmoney' => ['feexpay', 'paydunya'],
            'moov' => ['feexpay', 'fedapay', 'paydunya', 'pawapay'],
        ],
        'SN' => [ // Sénégal
            'wave' => ['paydunya', 'pawapay'],
            'orange' => ['feexpay', 'paydunya', 'pawapay'],
            'free' => ['feexpay', 'paydunya', 'pawapay'],
        ],
        'CI' => [ // Côte d'Ivoire
            'mtn' => ['feexpay', 'fedapay', 'paydunya', 'pawapay'],
            'moov' => ['feexpay', 'fedapay', 'paydunya', 'pawapay'],
            'orange' => ['feexpay', 'paydunya', 'pawapay'],
            'wave' => ['feexpay', 'paydunya', 'pawapay'],
        ],
        'BF' => [ // Burkina Faso
            'orange' => ['paydunya', 'pawapay'],
            'moov' => ['paydunya', 'pawapay'],
        ],
        'CM' => [ // Cameroun
            'mtn' => ['paydunya', 'pawapay'],
        ],
        'CG' => [ // Congo
            'mtn' => ['feexpay', 'pawapay'],
            'airtel' => ['pawapay'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Mapping réseau → correspondant MNO PawaPay
    |--------------------------------------------------------------------------
    */
    'pawapay_correspondents' => [
        'BJ_mtn' => 'MTN_MOMO_BEN',
        'BJ_moov' => 'MOOV_BEN',
        'TG_mtn' => 'MTN_MOMO_TGO',
        'TG_moov' => 'MOOV_TGO',
        'SN_wave' => 'WAVE_SEN',
        'SN_orange' => 'ORANGE_SEN',
        'SN_free' => 'FREE_SEN',
        'CI_mtn' => 'MTN_MOMO_CIV',
        'CI_moov' => 'MOOV_CIV',
        'CI_orange' => 'ORANGE_CIV',
        'CI_wave' => 'WAVE_CIV',
        'BF_orange' => 'ORANGE_BFA',
        'BF_moov' => 'MOOV_BFA',
        'CM_mtn' => 'MTN_MOMO_CMR',
        'CG_mtn' => 'MTN_MOMO_COG',
        'CG_airtel' => 'AIRTEL_COG',
    ],

];
