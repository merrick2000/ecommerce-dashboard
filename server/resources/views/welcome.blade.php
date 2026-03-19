<!DOCTYPE html>
<html lang="fr" id="html-root">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sellit — Vendez vos produits digitaux en Afrique</title>
    <meta name="description" content="Créez votre boutique en ligne et vendez vos e-books, formations, templates et plus. Paiement Mobile Money intégré.">
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --amber: #F59E0B;
            --amber-dark: #D97706;
            --amber-light: #FEF3C7;
            --dark: #0F172A;
            --gray: #64748B;
            --light: #F8FAFC;
        }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', system-ui, sans-serif; color: var(--dark); line-height: 1.6; }

        /* Nav */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #E2E8F0; }
        .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .logo { font-size: 24px; font-weight: 800; color: var(--dark); text-decoration: none; }
        .logo span { color: var(--amber); }
        .nav-links { display: flex; align-items: center; gap: 24px; }
        .nav-links a { text-decoration: none; color: var(--gray); font-size: 14px; font-weight: 500; transition: color .2s; }
        .nav-links a:hover { color: var(--dark); }
        .lang-switch { cursor: pointer; background: var(--light); border: 1px solid #E2E8F0; border-radius: 6px; padding: 4px 10px; font-size: 13px; font-weight: 600; color: var(--gray); }
        .lang-switch:hover { border-color: var(--amber); color: var(--amber); }

        /* Buttons */
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; transition: all .2s; border: none; cursor: pointer; }
        .btn-primary { background: var(--amber); color: #fff; }
        .btn-primary:hover { background: var(--amber-dark); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(245,158,11,0.4); }
        .btn-outline { background: transparent; color: var(--dark); border: 2px solid #E2E8F0; }
        .btn-outline:hover { border-color: var(--amber); color: var(--amber); }
        .btn-lg { padding: 16px 36px; font-size: 17px; border-radius: 10px; }
        .btn-white { background: #fff; color: var(--dark); }
        .btn-white:hover { background: var(--amber-light); transform: translateY(-1px); }

        /* Hero */
        .hero { padding: 120px 24px 80px; background: linear-gradient(135deg, #FFF 0%, var(--amber-light) 50%, #FFF 100%); text-align: center; }
        .hero-inner { max-width: 800px; margin: 0 auto; }
        .hero-badge { display: inline-block; background: var(--amber-light); color: var(--amber-dark); padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
        .hero h1 { font-size: clamp(32px, 5vw, 56px); font-weight: 800; line-height: 1.1; margin-bottom: 20px; letter-spacing: -0.02em; }
        .hero h1 span { color: var(--amber); }
        .hero p { font-size: 18px; color: var(--gray); max-width: 560px; margin: 0 auto 32px; }
        .hero-cta { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .hero-stats { display: flex; gap: 48px; justify-content: center; margin-top: 48px; padding-top: 48px; border-top: 1px solid #E2E8F0; }
        .hero-stat { text-align: center; }
        .hero-stat strong { display: block; font-size: 28px; font-weight: 800; color: var(--dark); }
        .hero-stat span { font-size: 13px; color: var(--gray); }

        /* Sections */
        .section { padding: 80px 24px; }
        .section-inner { max-width: 1200px; margin: 0 auto; }
        .section-title { text-align: center; margin-bottom: 56px; }
        .section-title h2 { font-size: clamp(24px, 3vw, 36px); font-weight: 800; margin-bottom: 12px; }
        .section-title p { color: var(--gray); font-size: 16px; max-width: 500px; margin: 0 auto; }
        .bg-light { background: var(--light); }

        /* Features */
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .feature-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px; transition: all .2s; }
        .feature-card:hover { border-color: var(--amber); box-shadow: 0 4px 16px rgba(245,158,11,0.1); transform: translateY(-2px); }
        .feature-icon { width: 48px; height: 48px; background: var(--amber-light); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px; }
        .feature-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .feature-card p { color: var(--gray); font-size: 14px; }

        /* Steps */
        .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 32px; counter-reset: step; }
        .step { text-align: center; position: relative; }
        .step-number { width: 56px; height: 56px; background: var(--amber); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; margin: 0 auto 16px; }
        .step h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .step p { color: var(--gray); font-size: 14px; }

        /* Pricing */
        .pricing-card { max-width: 440px; margin: 0 auto; background: #fff; border: 2px solid var(--amber); border-radius: 16px; padding: 40px; text-align: center; position: relative; }
        .pricing-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--amber); color: #fff; padding: 4px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .pricing-price { font-size: 48px; font-weight: 800; margin: 20px 0 8px; }
        .pricing-price span { font-size: 18px; color: var(--gray); font-weight: 500; }
        .pricing-features { list-style: none; text-align: left; margin: 24px 0; }
        .pricing-features li { padding: 8px 0; font-size: 15px; color: var(--gray); display: flex; align-items: center; gap: 10px; }
        .pricing-features li::before { content: "✓"; color: var(--amber); font-weight: 700; font-size: 16px; }

        /* CTA */
        .cta-section { background: var(--dark); color: #fff; padding: 80px 24px; text-align: center; }
        .cta-section h2 { font-size: clamp(24px, 3vw, 36px); font-weight: 800; margin-bottom: 16px; }
        .cta-section p { color: #94A3B8; font-size: 16px; max-width: 480px; margin: 0 auto 32px; }

        /* Footer */
        .footer { background: var(--dark); color: #94A3B8; padding: 32px 24px; border-top: 1px solid #1E293B; text-align: center; font-size: 13px; }
        .footer a { color: var(--amber); text-decoration: none; }

        /* Mobile */
        @media (max-width: 640px) {
            .nav-links a.hide-mobile { display: none; }
            .hero-stats { gap: 24px; }
            .hero-stat strong { font-size: 22px; }
        }

        /* Lang */
        [data-lang="en"] .fr { display: none; }
        [data-lang="fr"] .en { display: none; }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="nav">
        <div class="nav-inner">
            <a href="/" class="logo">Sell<span>it</span></a>
            <div class="nav-links">
                <a href="#features" class="hide-mobile">
                    <span class="fr">Fonctionnalités</span>
                    <span class="en">Features</span>
                </a>
                <a href="#how" class="hide-mobile">
                    <span class="fr">Comment ça marche</span>
                    <span class="en">How it works</span>
                </a>
                <a href="#pricing" class="hide-mobile">
                    <span class="fr">Tarifs</span>
                    <span class="en">Pricing</span>
                </a>
                <button class="lang-switch" onclick="toggleLang()">
                    <span class="fr">EN</span>
                    <span class="en">FR</span>
                </button>
                <a href="/admin/login" class="btn btn-outline" style="padding:8px 20px; font-size:13px;">
                    <span class="fr">Connexion</span>
                    <span class="en">Sign in</span>
                </a>
                <a href="/admin/register" class="btn btn-primary" style="padding:8px 20px; font-size:13px;">
                    <span class="fr">Commencer</span>
                    <span class="en">Get started</span>
                </a>
            </div>
        </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
        <div class="hero-inner">
            <div class="hero-badge">
                <span class="fr">Plateforme #1 de vente digitale en Afrique</span>
                <span class="en">#1 Digital Sales Platform in Africa</span>
            </div>
            <h1>
                <span class="fr">Vendez vos <span>produits digitaux</span> sans effort</span>
                <span class="en">Sell your <span>digital products</span> effortlessly</span>
            </h1>
            <p>
                <span class="fr">Créez votre boutique en 2 minutes. Acceptez les paiements Mobile Money. Livrez automatiquement vos fichiers. C'est aussi simple que ça.</span>
                <span class="en">Create your store in 2 minutes. Accept Mobile Money payments. Deliver your files automatically. It's that simple.</span>
            </p>
            <div class="hero-cta">
                <a href="/admin/register" class="btn btn-primary btn-lg">
                    <span class="fr">Créer ma boutique gratuitement</span>
                    <span class="en">Create my store for free</span>
                </a>
                <a href="#how" class="btn btn-outline btn-lg">
                    <span class="fr">Voir la démo</span>
                    <span class="en">See demo</span>
                </a>
            </div>
            <div class="hero-stats">
                <div class="hero-stat">
                    <strong>500+</strong>
                    <span class="fr">Vendeurs actifs</span>
                    <span class="en">Active sellers</span>
                </div>
                <div class="hero-stat">
                    <strong>10K+</strong>
                    <span class="fr">Produits vendus</span>
                    <span class="en">Products sold</span>
                </div>
                <div class="hero-stat">
                    <strong>8</strong>
                    <span class="fr">Pays couverts</span>
                    <span class="en">Countries covered</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Features -->
    <section class="section bg-light" id="features">
        <div class="section-inner">
            <div class="section-title">
                <h2>
                    <span class="fr">Tout ce qu'il vous faut pour vendre</span>
                    <span class="en">Everything you need to sell</span>
                </h2>
                <p>
                    <span class="fr">Des outils puissants pour maximiser vos ventes et convertir vos visiteurs en clients</span>
                    <span class="en">Powerful tools to maximize your sales and convert visitors into customers</span>
                </p>
            </div>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🏪</div>
                    <h3>
                        <span class="fr">Boutique clé en main</span>
                        <span class="en">Ready-made store</span>
                    </h3>
                    <p>
                        <span class="fr">Pages de vente optimisées pour la conversion avec 3 templates professionnels. Personnalisez les couleurs, textes et images.</span>
                        <span class="en">Conversion-optimized sales pages with 3 professional templates. Customize colors, text and images.</span>
                    </p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📱</div>
                    <h3>
                        <span class="fr">Paiement Mobile Money</span>
                        <span class="en">Mobile Money payments</span>
                    </h3>
                    <p>
                        <span class="fr">Wave, Orange Money, MTN MoMo, Moov Money, Free Money — vos clients paient avec ce qu'ils connaissent.</span>
                        <span class="en">Wave, Orange Money, MTN MoMo, Moov Money, Free Money — your customers pay with what they know.</span>
                    </p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <h3>
                        <span class="fr">Livraison automatique</span>
                        <span class="en">Automatic delivery</span>
                    </h3>
                    <p>
                        <span class="fr">Fichiers livrés instantanément après paiement. Liens sécurisés et temporaires. Stockage cloud illimité.</span>
                        <span class="en">Files delivered instantly after payment. Secure temporary links. Unlimited cloud storage.</span>
                    </p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3>
                        <span class="fr">Tracking & Analytics</span>
                        <span class="en">Tracking & Analytics</span>
                    </h3>
                    <p>
                        <span class="fr">Facebook Pixel, TikTok Pixel et Conversion API intégrés. Mesurez vos campagnes pub avec précision.</span>
                        <span class="en">Facebook Pixel, TikTok Pixel and Conversion API built-in. Measure your ad campaigns accurately.</span>
                    </p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔥</div>
                    <h3>
                        <span class="fr">Urgence & Social Proof</span>
                        <span class="en">Urgency & Social Proof</span>
                    </h3>
                    <p>
                        <span class="fr">Compte à rebours, places limitées, pop-ups de vente, offres flash — boostez vos taux de conversion.</span>
                        <span class="en">Countdown timers, limited spots, sales pop-ups, flash offers — boost your conversion rates.</span>
                    </p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🛡️</div>
                    <h3>
                        <span class="fr">Dashboard complet</span>
                        <span class="en">Complete dashboard</span>
                    </h3>
                    <p>
                        <span class="fr">Suivez vos ventes en temps réel, gérez vos produits, et analysez les performances de chaque boutique.</span>
                        <span class="en">Track your sales in real-time, manage your products, and analyze each store's performance.</span>
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- How it works -->
    <section class="section" id="how">
        <div class="section-inner">
            <div class="section-title">
                <h2>
                    <span class="fr">Lancez-vous en 3 étapes</span>
                    <span class="en">Get started in 3 steps</span>
                </h2>
                <p>
                    <span class="fr">Pas besoin de compétences techniques. De l'inscription à votre première vente en moins de 5 minutes.</span>
                    <span class="en">No technical skills needed. From sign-up to your first sale in under 5 minutes.</span>
                </p>
            </div>
            <div class="steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <h3>
                        <span class="fr">Créez votre compte</span>
                        <span class="en">Create your account</span>
                    </h3>
                    <p>
                        <span class="fr">Inscrivez-vous gratuitement en 30 secondes. Aucune carte bancaire requise.</span>
                        <span class="en">Sign up for free in 30 seconds. No credit card required.</span>
                    </p>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <h3>
                        <span class="fr">Ajoutez vos produits</span>
                        <span class="en">Add your products</span>
                    </h3>
                    <p>
                        <span class="fr">Uploadez vos fichiers, définissez vos prix en FCFA, personnalisez votre page de vente.</span>
                        <span class="en">Upload your files, set your prices, customize your sales page.</span>
                    </p>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <h3>
                        <span class="fr">Partagez & Vendez</span>
                        <span class="en">Share & Sell</span>
                    </h3>
                    <p>
                        <span class="fr">Partagez le lien de votre boutique sur les réseaux sociaux et commencez à encaisser.</span>
                        <span class="en">Share your store link on social media and start earning.</span>
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing -->
    <section class="section bg-light" id="pricing">
        <div class="section-inner">
            <div class="section-title">
                <h2>
                    <span class="fr">Simple et transparent</span>
                    <span class="en">Simple and transparent</span>
                </h2>
                <p>
                    <span class="fr">Commencez gratuitement, payez uniquement quand vous vendez</span>
                    <span class="en">Start for free, pay only when you sell</span>
                </p>
            </div>
            <div class="pricing-card">
                <div class="pricing-badge">
                    <span class="fr">Populaire</span>
                    <span class="en">Popular</span>
                </div>
                <div class="pricing-price">
                    0 <span>FCFA</span>
                </div>
                <p style="color: var(--gray); font-size: 14px;">
                    <span class="fr">Pour commencer — 5% de commission par vente</span>
                    <span class="en">To get started — 5% commission per sale</span>
                </p>
                <ul class="pricing-features">
                    <li>
                        <span class="fr">Boutiques illimitées</span>
                        <span class="en">Unlimited stores</span>
                    </li>
                    <li>
                        <span class="fr">Produits illimités</span>
                        <span class="en">Unlimited products</span>
                    </li>
                    <li>
                        <span class="fr">Paiement Mobile Money</span>
                        <span class="en">Mobile Money payments</span>
                    </li>
                    <li>
                        <span class="fr">Livraison automatique des fichiers</span>
                        <span class="en">Automatic file delivery</span>
                    </li>
                    <li>
                        <span class="fr">3 templates de page de vente</span>
                        <span class="en">3 sales page templates</span>
                    </li>
                    <li>
                        <span class="fr">Facebook & TikTok Pixel</span>
                        <span class="en">Facebook & TikTok Pixel</span>
                    </li>
                    <li>
                        <span class="fr">Dashboard & analytics</span>
                        <span class="en">Dashboard & analytics</span>
                    </li>
                    <li>
                        <span class="fr">Support par WhatsApp</span>
                        <span class="en">WhatsApp support</span>
                    </li>
                </ul>
                <a href="/admin/register" class="btn btn-primary" style="width:100%;">
                    <span class="fr">Commencer gratuitement</span>
                    <span class="en">Start for free</span>
                </a>
            </div>
        </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
        <h2>
            <span class="fr">Prêt à vendre vos produits digitaux ?</span>
            <span class="en">Ready to sell your digital products?</span>
        </h2>
        <p>
            <span class="fr">Rejoignez des centaines de vendeurs qui utilisent Sellit pour monétiser leurs créations en Afrique.</span>
            <span class="en">Join hundreds of sellers using Sellit to monetize their creations in Africa.</span>
        </p>
        <a href="/admin/register" class="btn btn-white btn-lg">
            <span class="fr">Créer ma boutique maintenant</span>
            <span class="en">Create my store now</span>
        </a>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <p>
            <span class="fr">&copy; {{ date('Y') }} <a href="/">Sellit</a>. Tous droits réservés. Fait avec ❤️ pour l'Afrique.</span>
            <span class="en">&copy; {{ date('Y') }} <a href="/">Sellit</a>. All rights reserved. Made with ❤️ for Africa.</span>
        </p>
    </footer>

    <script>
        function toggleLang() {
            const root = document.getElementById('html-root');
            const current = root.getAttribute('data-lang') || 'fr';
            const next = current === 'fr' ? 'en' : 'fr';
            root.setAttribute('data-lang', next);
            root.setAttribute('lang', next);
            localStorage.setItem('sellit-lang', next);
        }

        // Restore saved language
        (function() {
            const saved = localStorage.getItem('sellit-lang');
            if (saved) {
                document.getElementById('html-root').setAttribute('data-lang', saved);
                document.getElementById('html-root').setAttribute('lang', saved);
            } else {
                document.getElementById('html-root').setAttribute('data-lang', 'fr');
            }
        })();

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                const target = document.querySelector(a.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    </script>
</body>
</html>
