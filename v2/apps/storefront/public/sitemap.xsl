<?xml version="1.0" encoding="UTF-8"?>
<!-- Mise en forme du sitemap pour les humains. Les moteurs de recherche lisent le XML brut et ignorent ce fichier. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="fr">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>Plan du site | Zuri</title>
        <style>
          body { margin: 0; background: #fbfaf7; color: #1c1917; font: 15px/1.5 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; }
          .wrap { max-width: 1100px; margin: 0 auto; padding: 32px 16px; }
          h1 { margin: 0 0 6px; font-size: 1.8rem; }
          p { margin: 0 0 20px; color: #57534e; }
          .box { background: #fff; border: 1px solid #e7e5e4; border-radius: 16px; overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #f5f5f4; white-space: nowrap; }
          th { background: #1c1917; color: #fff; font-size: 0.85rem; }
          td:first-child { white-space: normal; word-break: break-all; }
          tr:hover td { background: #fef3c7; }
          a { color: #b45309; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .n { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #fef3c7; color: #b45309; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>Plan du site Zuri</h1>
          <p>Ce fichier sert aux moteurs de recherche. <span class="n"><xsl:value-of select="count(s:urlset/s:url)"/> pages</span></p>
          <div class="box">
            <table>
              <tr><th>Adresse</th><th>Mise à jour</th><th>Fréquence</th><th>Priorité</th></tr>
              <xsl:for-each select="s:urlset/s:url">
                <tr>
                  <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                  <td><xsl:value-of select="substring(s:lastmod, 1, 10)"/></td>
                  <td><xsl:value-of select="s:changefreq"/></td>
                  <td><xsl:value-of select="s:priority"/></td>
                </tr>
              </xsl:for-each>
            </table>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
