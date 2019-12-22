
import { Socket } from 'net';
import crypto from 'crypto';
import EventEmitter3 from 'eventemitter3';

const OP_ERROR = 0;
const OP_INFO = 1;
const OP_AUTH = 2;
const OP_PUBLISH = 3;
const OP_SUBSCRIBE = 4;

const msghdr = (op, data) => {
  const length = 5 + data.length;

  const buf = Buffer.alloc(length);

  buf.writeInt32BE(length, 0);
  buf.writeUInt8(op, 4);
  data.copy(buf, 5);
  return buf;
}

const msgsubscribe = (ident, channel) => {

  const ilength = Buffer.byteLength(ident);
  const clength = Buffer.byteLength(channel);

  const buf = new Buffer(1+ilength+clength);

  buf.writeUInt8(ilength, 0);
  buf.write(ident, 1, ilength);
  buf.write(channel, 1+clength);

  return msghdr(OP_SUBSCRIBE, buf);
}

const msgpublish = (ident, channel, payload) => {

  const ilength = Buffer.byteLength(ident);
  const clength = Buffer.byteLength(channel);
  const plength = Buffer.byteLength(payload);

  const buf = new Buffer(1+ilength+1+clength+plength);

  buf.writeUInt8(ilength, 0);
  buf.write(ident, 1, ilength);
  buf.writeUInt8(clength, 1+ilength);
  buf.write(channel, 1+ilength+1);
  buf.write(payload, 1+ilength+1+clength);

  return msghdr(OP_PUBLISH, buf);
}

const msgauth = (nounce, ident, secret) => {
  const hashobj = crypto.createHash('sha1');

  hashobj.update(nounce);
  hashobj.update(secret, 'ascii');

  const hash = hashobj.digest('binary');
  const hashbuf = new Buffer.alloc(20);

  hashbuf.write(hash, 'binary');

  const length = Buffer.byteLength(ident);

  const buf = new Buffer(1+length+20);

  buf.writeUInt8(length, 0);
  buf.write(ident, 1, length);
  hashbuf.copy(buf, 1+length);

  return msghdr(OP_AUTH, buf);
}

class Client extends EventEmitter3 {

  constructor(host, port, ident, secret) {
    super();
    this.host = host;
    this.port = port;
    this.ident = ident;
    this.secret = secret;
    this.buf = Buffer.alloc(0)
    this.ready = false;
  }

  connect(cb) {

    if(this.socket) {
      return cb(new Error('Client.connect is already called'));
    }

    if(cb) {
      this.once('connected', cb);
    }

    this.socket = new Socket();

    this.socket.on('data', data => this.on_data(data))

    this.socket.connect(this.port, this.host);
  }

  on_data(data) {

    this.buf = Buffer.concat([this.buf, data])

    while (this.buf.length > 4) {
      const message_length = this.buf.readInt32BE(0);
      const opcode = this.buf.readUInt8(4);

      if(this.buf.length < message_length) {
        /*
         * Wait for the remainder of the message
         * to arrive
         */
        break;
      }

      const payload = this.buf.slice(5, message_length);

      this.handle(opcode, payload);

      this.buf = this.buf.slice(message_length)
    }
  }

  handle(opcode, payload) {
    if (opcode === OP_INFO) {
      const next = payload.readUInt8(0);
      const name = payload.slice(1, 1+next);
      const nonce = payload.slice(1+next);

      this.brokername = name.toString();
      this.ready = true;

      this.emit('connected', name.toString());

      this.socket.write(msgauth(nonce, this.ident, this.secret));
    }
    else if (opcode == OP_PUBLISH) {
      const ilength = payload.readUInt8(0);
      const ident = payload.slice(1, 1+length).toString();
      const clength = length.readUInt8(1+length);
      const channel = payload.slice(1+1+ilength, 1+1+ilength+clength).toString();
      const payload = payload.slice(1+1+ilength+clength);

      try {
        this.emit('data', channel, JSON.parse(payload));
      }
      catch (err) {
        this.emit('error', err);
        return;
      }

    }
    else if (opcode == OP_ERROR) {
      this.emit('error', new Error(payload.toString()))
    }
    else {
      this.emit('error', new Error('Unknow hpfeeds opcode: ' + opcode))
    }
  }

  subscribe(channel, cb) {
    this.socket.write(msgsubscribe(this.ident, channel), cb);
  }

  publish(channel, payload, cb) {

    if(typeof(payload) === 'object') {
      payload = JSON.stringify(payload)
    }

    this.socket.write(msgpublish(this.ident, channel, payload), cb);
  }

  close(cb) {
    this.socket.end(() => {
      this.socket = null;
      cb && cb();
    })
  }

};

module.exports = Client;
