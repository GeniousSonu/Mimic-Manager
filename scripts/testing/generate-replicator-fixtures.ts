import * as fs from 'fs';
import * as path from 'path';

const fixturesDir = path.join(process.cwd(), 'test/fixtures/replicator');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

const fixtures: Record<string, string> = {
  '01-hero.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Hero Showcase</title></head>
<body>
  <header class="hero-section">
    <h1>Accelerate Your Digital Presence</h1>
    <p>Empower your business with next-generation optimization and automated page replication workflows.</p>
    <a href="https://example.com/get-started" class="btn btn-primary">Start Free Trial</a>
  </header>
</body>
</html>`,

  '02-pricing.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Pricing Plans</title></head>
<body>
  <section class="pricing-container grid">
    <div class="pricing-card">
      <h2>Starter</h2>
      <p class="price">$19 / month</p>
      <ul>
        <li>1 Site Connection</li>
        <li>Basic Optimization</li>
        <li>Community Support</li>
      </ul>
      <a href="/checkout/starter" class="button">Select Starter</a>
    </div>
    <div class="pricing-card featured">
      <h2>Pro Business</h2>
      <p class="price">$49 / month</p>
      <ul>
        <li>Unlimited Sites</li>
        <li>Priority Optimization</li>
        <li>Live Replicator Studio</li>
      </ul>
      <a href="/checkout/pro" class="button">Select Pro</a>
    </div>
  </section>
</body>
</html>`,

  '03-navbar.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Navigation Bar</title></head>
<body>
  <nav class="site-navigation">
    <a href="/" class="logo">BrandLogo</a>
    <ul class="nav-links">
      <li><a href="/features">Features</a></li>
      <li><a href="/pricing">Pricing</a></li>
      <li><a href="/docs">Documentation</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
    <button type="button" class="btn-cta">Sign In</button>
  </nav>
</body>
</html>`,

  '04-footer.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Site Footer</title></head>
<body>
  <footer class="main-footer">
    <div class="footer-col">
      <h3>About Us</h3>
      <p>Building high-performance WordPress tools with zero lock-in.</p>
    </div>
    <div class="footer-col">
      <h3>Quick Links</h3>
      <ul>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
        <li><a href="/security">Security Center</a></li>
      </ul>
    </div>
    <p class="copyright">&copy; 2026 Wefik. All rights reserved.</p>
  </footer>
</body>
</html>`,

  '05-card-grid.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Card Grid</title></head>
<body>
  <section class="card-grid cols-3">
    <article class="card">
      <img src="https://images.unsplash.com/photo-1518770660439-4636190af475" alt="Speed">
      <h3>Ultra Fast Caching</h3>
      <p>Sub-millisecond asset delivery directly to edge nodes.</p>
    </article>
    <article class="card">
      <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa" alt="Security">
      <h3>Bank-Grade Security</h3>
      <p>Comprehensive path jail and safe execution boundaries.</p>
    </article>
    <article class="card">
      <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5" alt="Replication">
      <h3>Accurate Replication</h3>
      <p>Convert external websites to standard Gutenberg blocks.</p>
    </article>
  </section>
</body>
</html>`,

  '06-flex.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Flexbox Layout</title></head>
<body>
  <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
    <div class="flex-item">
      <h2>Flex item 1</h2>
      <p>First column text with flexible expansion.</p>
    </div>
    <div class="flex-item">
      <h2>Flex item 2</h2>
      <p>Second column text with automatic alignment.</p>
    </div>
  </div>
</body>
</html>`,

  '07-grid.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>CSS Grid Layout</title></head>
<body>
  <div class="grid-wrapper" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
    <div class="grid-cell">
      <h3>Column A</h3>
      <p>Grid column content item with responsive auto flow.</p>
    </div>
    <div class="grid-cell">
      <h3>Column B</h3>
      <p>Grid column content item with matched heights.</p>
    </div>
  </div>
</body>
</html>`,

  '08-bg-images.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Background Images</title></head>
<body>
  <section class="banner-bg" style="background-image: url('https://example.com/hero-bg.jpg'); background-size: cover;">
    <h2>High Impact Visuals</h2>
    <p>Rich visual storytelling with responsive background images.</p>
    <button class="button">Explore Gallery</button>
  </section>
</body>
</html>`,

  '09-web-fonts.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Typography & Web Fonts</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body>
  <main class="typography-test">
    <h1>Typography Hierarchy</h1>
    <p>Elegant typography using modern system and web fonts.</p>
    <blockquote>Design is intelligence made visible.</blockquote>
  </main>
</body>
</html>`,

  '10-sticky-header.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Sticky Header</title></head>
<body>
  <header style="position: sticky; top: 0; background: #fff; z-index: 100;">
    <h2>Sticky Navigation Bar</h2>
    <p>Stays pinned to top during user scroll journeys.</p>
  </header>
  <section>
    <p>Main content paragraph 1.</p>
    <p>Main content paragraph 2.</p>
  </section>
</body>
</html>`,

  '11-responsive-breakpoints.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Responsive Breakpoints</title></head>
<body>
  <div class="responsive-box">
    <h2>Mobile, Tablet & Desktop Ready</h2>
    <p>Adapts fluidly across screen dimensions.</p>
  </div>
</body>
</html>`,

  '12-pseudo-elements.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Pseudo Elements</title></head>
<body>
  <section class="accented-quote">
    <blockquote class="fancy">
      <p>Innovating with precision and simplicity.</p>
    </blockquote>
  </section>
</body>
</html>`,

  '13-forms.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Form Elements</title></head>
<body>
  <section class="contact-section">
    <h2>Get In Touch</h2>
    <form action="/submit" method="post">
      <label>Name: <input type="text" name="name" placeholder="Your name"></label>
      <label>Email: <input type="email" name="email" placeholder="you@domain.com"></label>
      <button type="submit">Send Message</button>
    </form>
  </section>
</body>
</html>`,

  '14-faq-accordion-static.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>FAQ Accordion</title></head>
<body>
  <section class="faq-section">
    <h2>Frequently Asked Questions</h2>
    <details>
      <summary>How does UI Replicator work?</summary>
      <p>It parses static HTML structure and translates elements into standard Gutenberg blocks.</p>
    </details>
    <details>
      <summary>Is SSRF protection enforced?</summary>
      <p>Yes. Private IPs, loopbacks, link-local addresses, and AWS metadata endpoints are blocked.</p>
    </details>
  </section>
</body>
</html>`,

  '15-dark-theme.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Dark Theme Showcase</title></head>
<body style="background-color: #121212; color: #f5f5f5;">
  <section class="dark-card" style="background: #1e1e1e; padding: 24px;">
    <h2>Dark Mode First</h2>
    <p>High contrast, easy on the eyes, tailored for pro developers.</p>
    <a href="#" class="btn btn-secondary">Learn More</a>
  </section>
</body>
</html>`,

  '16-rtl.html': `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><title>RTL Language Support</title></head>
<body>
  <section class="rtl-content">
    <h2>مرحباً بكم في Mimic Manager</h2>
    <p>أداة إدارة وتكرار واجهات المستخدم السريعة والآمنة لمواقع ووردبريس.</p>
    <button class="button">ابدأ الآن</button>
  </section>
</body>
</html>`,

  '17-big-dom.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Deep and Large DOM</title></head>
<body>
  <main class="large-container">
    <h2>Deep Hierarchy Tree</h2>
    ${Array.from({ length: 50 }, (_, i) => `
      <div class="row row-${i}">
        <h3>Item Section ${i + 1}</h3>
        <p>Paragraph content for row index ${i + 1} with standard nested markup.</p>
      </div>
    `).join('')}
  </main>
</body>
</html>`,

  '18-malformed-html.html': `<!DOCTYPE html>
<html>
<head><title>Malformed Markup</title>
<body>
  <section class="malformed">
    <h1>Unclosed heading tag
    <p>Unclosed paragraph with <b>bold and <i>italic unclosed
    <div>Missing closing tags inside container
  </section>
</body>
</html>`,

  '19-hostile-page-scripts-redirects.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Hostile Page With Injected Scripts</title>
  <script>window.location.href = "https://malicious-site.example.com/steal";</script>
  <script src="https://evil.example.com/keylogger.js"></script>
</head>
<body onload="alert('XSS Execution')">
  <section class="safe-content">
    <h2 onclick="maliciousFunction()">Clean Heading Title</h2>
    <p onmouseover="alert(1)">This paragraph has dangerous attributes that must be stripped cleanly.</p>
    <a href="javascript:alert('Hacked')" class="button">Click Exploited Link</a>
    <iframe src="https://hidden-phish.example.com"></iframe>
  </section>
</body>
</html>`,

  '20-js-required-page.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>SPA / JS Required Page</title></head>
<body>
  <div id="root">
    <noscript>
      <h2>JavaScript Required</h2>
      <p>This single-page application requires JavaScript or Mode B browser service to render dynamic components.</p>
    </noscript>
    <div class="fallback-static">
      <h2>Static Placeholder</h2>
      <p>Content rendered before hydration begins.</p>
    </div>
  </div>
</body>
</html>`
};

for (const [filename, content] of Object.entries(fixtures)) {
  const filePath = path.join(fixturesDir, filename);
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf-8');
  console.log(`Created ${filename} (${content.length} bytes)`);
}

console.log('All 20 fixtures generated successfully.');
