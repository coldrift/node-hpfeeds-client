## node hpfeeds3 client

Native hpfeeds3 client for node.js

## Installation

```
$ npm install --save node-hpfeeds-client
```

### Example

```javascript
const Client = require('node-hpfeeds-client');

const hpfeeds = new Client('test.example.com', 10000, 'user', 'abcd');

hpfeeds.on('data', console.log);

hpfeeds.on('error', err => {
  console.error(err)
  hpfeeds.close();
});

hpfeeds.connect(err => {
  if(err) {
    console.error(err);
    return;
  }

  console.log('connected');

  hpfeeds.subscribe('test.channel', () => {

    console.log('subscribed');

    hpfeeds.publish('test', {test: "test"}, () => {
      console.log('published');
      hpfeeds.close();
    });
  });
});
```

## API

### Instantiating

Instantiate the hpfeeds client by passing the host to connect to, the port,
the user and the secret to the constructor as arguments:

```javascript
  const Client = require('node-hpfeeds-client')

  const hpfeeds = new Client('testhost.example.com', 10000, 'user', 'secret');
```

### Connecting

To connect call *connect([cb])* with optional callback

```javascript
  const Client = require('node-hpfeeds-client')

  const hpfeeds = new Client('testhost.example.com', 10000, 'user', 'secret');

  hpfeeds.connect(() => {
    console.log('connected!');
  });
```

### Subscribing

Use *subscribe(channel, [cb])* to subscribe to a channel with hpfeeds server:

```javascript

  hpfeeds.subscribe('test_channel', () => {
    console.log('subscribed!');
  });
```

### Publishing

Use *publish(channel, payload, [cb])* to publish data to a channel at hpfeeds server:

```javascript

  hpfeeds.publish('test_channel', {test: 'test'}, () => {
    console.log('ready to publish more data!');
  });
```

### Disconnecting

Use *close([cb])* to disconnect from hpfeeds server

```javascript
  hpfeeds.close(() => {
    console.log('disconnected!');
  });
```

## Events

### 'connected'

Emitted when the connection is established and a server info message is received.

*callback(err, server_name)*

```javascript
  hpfeeds.on('connected', (err, name) => {
    if(err) {
      console.error(err);
      return;
    }
    console.log('connected to', name);
  });
```

### 'data'

Emitted when new data is available in one of the subscribed channels.

*callback(channel, data)*

```javascript
  hpfeeds.on('data', (channel, data) => {
    console.log('received ', channel, data);
  });
```

### 'error'

Emitted when an error occurs (including authentication errors)

*callback(err)*

```javascript
  hpfeeds.on('error', err => {
    console.error(err);
    hpfeeds.close();
  });
```

## License

Licensed under MIT License. Copyright 2019 Coldrift Technologies B.V. All rights reserved.

## Maintenance and support
[Visit the company's website](https://coldrift.com/)

## References

1. [Hpfeeds3 Wire Protocol](https://hpfeeds.org/wire-protocol)
