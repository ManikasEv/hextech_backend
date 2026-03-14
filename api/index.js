module.exports = (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hextech API</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #000a16;
      color: #fff;
      font-family: 'Courier New', monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container { text-align: center; padding: 2rem; }
    .logo {
      font-size: 2.5rem;
      font-weight: 700;
      color: #00e5ff;
      letter-spacing: 0.2em;
      margin-bottom: 0.5rem;
    }
    .tagline {
      font-size: 1rem;
      color: #ffffff88;
      margin-bottom: 2.5rem;
    }
    .welcome {
      font-size: 1.1rem;
      color: #fff;
      margin-bottom: 2rem;
    }
    .endpoints {
      background: #0a1628;
      border: 1px solid #00e5ff22;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      display: inline-block;
      text-align: left;
    }
    .endpoints h3 {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #00e5ff88;
      margin-bottom: 1rem;
    }
    .endpoint {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.6rem;
      font-size: 0.9rem;
    }
    .endpoint:last-child { margin-bottom: 0; }
    .method {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      min-width: 48px;
      text-align: center;
    }
    .get  { background: #00e5ff22; color: #00e5ff; }
    .post { background: #00ff8822; color: #00ff88; }
    .put  { background: #ffaa0022; color: #ffaa00; }
    .del  { background: #ff444422; color: #ff6666; }
    .path { color: #ffffffcc; }
    .status {
      margin-top: 2rem;
      font-size: 0.75rem;
      color: #ffffff44;
    }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #00ff88;
      border-radius: 50%;
      margin-right: 6px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">HEXTECH</div>
    <div class="tagline">Backend API — Vercel Serverless</div>
    <p class="welcome">👋 Hello! Welcome to the Hextech API.</p>
    <div class="endpoints">
      <h3>Available Endpoints</h3>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/projects</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/projects/:id</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/projects</span>
      </div>
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/projects/:id</span>
      </div>
      <div class="endpoint">
        <span class="method del">DELETE</span>
        <span class="path">/api/projects/:id</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/health</span>
      </div>
    </div>
    <p class="status"><span class="dot"></span>All systems operational</p>
  </div>
</body>
</html>`);
};
