const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DB_PATH = path.join(__dirname, 'db.json');
const TX_LOG = path.join(__dirname, 'transactions.log');
const JWT_SECRET = process.env.JWT_SECRET || 'verysecretkey';

function readDB(){
  try{
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  }catch(e){
    return { users: [], institutions: [], certificates: [] };
  }
}
function writeDB(db){
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
function simulateTx(payload){
  const hash = crypto.createHash('sha256').update(JSON.stringify(payload) + Date.now().toString()).digest('hex');
  const txHash = '0x' + hash;
  const record = { txHash, payload, time: new Date().toISOString(), blockNumber: Math.floor(Math.random()*1000000) };
  fs.appendFileSync(TX_LOG, JSON.stringify(record) + '\n');
  return record;
}

// Auth (simple JWT)
app.post('/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'missing fields' });
  const db = readDB();
  if(db.users.find(u => u.email === email)) return res.status(400).json({ error: 'user exists' });
  const user = { id: 'U-' + Date.now(), name: name||'', email, password, role: role||'learner', createdAt: new Date().toISOString() };
  db.users.push(user);
  writeDB(db);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email && u.password === password);
  if(!user) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ error: 'no auth' });
  const token = auth.replace('Bearer ', '');
  try{
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  }catch(e){
    return res.status(401).json({ error: 'invalid token' });
  }
}

// Issue certificate (protected: institution/admin)
app.post('/api/issue', authMiddleware, (req, res) => {
  const { learnerName, course, issuedBy } = req.body;
  if(!learnerName || !course || !issuedBy) return res.status(400).json({ error: 'missing fields' });
  const db = readDB();
  const id = 'CERT-' + Date.now();
  const cert = {
    id,
    learnerName,
    course,
    issuedBy,
    issuedAt: new Date().toISOString(),
    revoked: false
  };
  const tx = simulateTx({ action: 'issue', cert });
  cert.txHash = tx.txHash;
  cert.blockNumber = tx.blockNumber;
  db.certificates.push(cert);
  writeDB(db);
  res.json({ success: true, certificate: cert, tx });
});

// Verify certificate
app.get('/api/verify/:id', (req, res) => {
  const id = req.params.id;
  const db = readDB();
  const cert = db.certificates.find(c => c.id === id);
  if(!cert) return res.json({ valid: false, message: 'Certificate not found' });
  if(cert.revoked) return res.json({ valid: false, message: 'Certificate revoked', certificate: cert });
  res.json({ valid: true, certificate: cert });
});

// Revoke certificate (protected)
app.post('/api/revoke/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  const db = readDB();
  const cert = db.certificates.find(c => c.id === id);
  if(!cert) return res.status(404).json({ error: 'not found' });
  cert.revoked = true;
  const tx = simulateTx({ action: 'revoke', id, by: req.user.email });
  cert.revokeTx = tx.txHash;
  writeDB(db);
  res.json({ success:true, cert, tx });
});

// Stats
app.get('/api/stats', (req, res) => {
  const db = readDB();
  const total = db.certificates.length;
  const revoked = db.certificates.filter(c=>c.revoked).length;
  const users = db.users.length;
  res.json({ totalCertificates: total, revokedCertificates: revoked, totalUsers: users });
});

// List certificates with search/sort/pagination
app.get('/api/certificates', (req, res) => {
  const db = readDB();
  let items = db.certificates.slice().reverse();
  const q = req.query.q;
  if(q){ items = items.filter(c => (c.learnerName + ' ' + c.course + ' ' + c.id + ' ' + (c.issuedBy||'')).toLowerCase().includes(q.toLowerCase())); }
  const sort = req.query.sort || 'issuedAt'; // issuedAt or learnerName
  const order = req.query.order === 'asc' ? 1 : -1;
  items.sort((a,b) => (a[sort] > b[sort] ? order : -order));
  const page = parseInt(req.query.page||'1');
  const limit = parseInt(req.query.limit||'10');
  const start = (page-1)*limit;
  const paged = items.slice(start, start+limit);
  res.json({ total: items.length, page, limit, data: paged });
});

// Get single certificate
app.get('/api/certificate/:id', (req, res) => {
  const id = req.params.id;
  const db = readDB();
  const cert = db.certificates.find(c => c.id === id);
  if(!cert) return res.status(404).json({ error: 'not found' });
  res.json(cert);
});

// Generate PDF for certificate (with QR)
app.get('/api/certificate/:id/pdf', async (req, res) => {
  const id = req.params.id;
  const db = readDB();
  const cert = db.certificates.find(c => c.id === id);
  if(!cert) return res.status(404).json({ error: 'not found' });

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${cert.id}.pdf"`);

  const qrData = JSON.stringify({ id: cert.id, txHash: cert.txHash });
  const qrImage = await QRCode.toDataURL(qrData);

  doc.image(Buffer.from(qrImage.split(',')[1], 'base64'), 450, 110, { width: 100 });
  doc.fontSize(20).text('Certificate of Achievement', 50, 100);
  doc.moveDown();
  doc.fontSize(14).text(`Certificate ID: ${cert.id}`);
  doc.text(`Learner: ${cert.learnerName}`);
  doc.text(`Course: ${cert.course}`);
  doc.text(`Issued By: ${cert.issuedBy}`);
  doc.text(`Issued At: ${cert.issuedAt}`);
  doc.text(`Blockchain Tx: ${cert.txHash}`);
  doc.end();
  doc.pipe(res);
});

// Users & institutions (admin only endpoints)
app.get('/api/users', authMiddleware, (req, res) => {
  const db = readDB();
  res.json(db.users.reverse());
});

app.get('/api/institutions', authMiddleware, (req, res) => {
  const db = readDB();
  res.json(db.institutions.reverse());
});

app.post('/api/institutions', authMiddleware, (req, res) => {
  const db = readDB();
  const { name, email } = req.body;
  const id = 'I-' + Date.now();
  const inst = { id, name, email, approved: false, createdAt: new Date().toISOString() };
  db.institutions.push(inst);
  writeDB(db);
  res.json(inst);
});

app.post('/api/institutions/approve/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  const db = readDB();
  const inst = db.institutions.find(i=>i.id===id);
  if(!inst) return res.status(404).json({ error: 'not found' });
  inst.approved = true;
  writeDB(db);
  res.json({ success:true, inst });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Server listening on', PORT));
