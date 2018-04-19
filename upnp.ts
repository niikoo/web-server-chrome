// multiple devices are using the same extenal port. need to retry for other ports, or randomize chosen port based on GUID would be easiest.

// if switching from wlan to eth, it will fail to map the port because we mapped on the other interface.

// check current mappings and don't attempt to map to an externally bound port

// could choose port by hashing GUID + interface name

// inspiration from https://github.com/indutny/node-nat-upnp
import { ChromeSocketXMLHttpRequest } from './chromesocketxhr';
import { Destructor } from './destructor';
import { WSC } from './common';

declare let TextEncoder: any;
declare let TextDecoder: any;

export class UPNP implements Destructor {
  port = 8888;
  name = 'web-server-chrome upnp.js'
  searchtime = 2000
  ssdp: SSDP = null;
  callback;
  desiredServices = [
    'urn:schemas-upnp-org:service:WANIPConnection:1',
    'urn:schemas-upnp-org:service:WANPPPConnection:1'
  ]
  devices;
  validGateway = null
  interfaces = null
  mapping = null
  searching = false
  constructor(
    opts) {
    this.port = opts.port
    this.name = opts.name || 'web-server-chrome upnp.js'
    this.searchtime = opts.searchtime || 2000
    this.ssdp = new SSDP(this, { port: opts.port, searchtime: this.searchtime })
    this.desiredServices = [
      'urn:schemas-upnp-org:service:WANIPConnection:1',
      'urn:schemas-upnp-org:service:WANPPPConnection:1'
    ]
    this.validGateway = null
    this.interfaces = null
    this.mapping = null
    this.searching = false
  }
  flatParseNode(node) {
    let d = {}
    for (let i = 0; i < node.children.length; i++) {
      let c = node.children[i]
      if (c.children.length == 0) {
        d[c.tagName] = c.innerHTML
      }
    }
    return d
  }
  allDone(result) {
    if (this.callback) { this.callback(result) }
  }
  onDestroy() {
    this.ssdp.cleanup();
  }
  getInternalAddress() {
    let gatewayhost = this.validGateway.device.url.hostname
    let gateparts = gatewayhost.split('.')
    let match = false

    for (let i = gateparts.length - 1; i--; i < 1) {
      let pre = gateparts.slice(0, i).join('.')
      for (let j = 0; j < this.interfaces.length; j++) {
        if (this.interfaces[j].prefixLength == 24) {
          let iparts = this.interfaces[j].address.split('.')
          let ipre = iparts.slice(0, i).join('.')
          if (ipre == pre) {
            match = this.interfaces[j].address
            console.log("UPNP", "selected internal address", match)
            return match
          }
        }
      }

    }
  }
  reset(callback) {
    this.callback = callback
    console.log('UPNP', "search start")
    this.searching = true
    chrome.system.network.getNetworkInterfaces(function (interfaces) {
      this.interfaces = interfaces
      this.devices = []
      // TODO -- remove event listeners
      this.ssdp.addEventListener('device', this.onDevice.bind(this))
      this.ssdp.addEventListener('stop', this.onSearchStop.bind(this))
      this.ssdp.search() // stop searching after a bit.
    }.bind(this))
  }
  onSearchStop(info) {
    console.log('UPNP', "search stop")
    this.searching = false
    this.getIP((gotIP) => {
      if (!gotIP) { return this.allDone(false) }
      this.getMappings((mappings) => {
        if (!mappings) {
          return this.allDone(false);
        }
        // check if already exists nice mapping we can use.
        let internal = this.getInternalAddress();
        console.log('UPNP', 'got current mappings', mappings, 'internal address', internal);
        for (let i = 0; i < mappings.length; i++) {
          if (mappings[i].NewInternalClient == internal &&
            mappings[i].NewInternalPort == this.port &&
            mappings[i].NewProtocol == "TCP") {
            // found it
            console.log('UPNP', 'already have port mapped')
            this.mapping = mappings[i]
            this.allDone(true)
            return
          }
        }
        this.addMapping(this.port, 'TCP', (result) => {
          console.log('UPNP', 'add TCP mapping result', result)
          if (result.wantUDP) { // ? was this.wantUDP before going to arrow function
            this.addMapping(this.port, 'UDP', (result) => {
              console.log('UPNP', 'add UDP mapping result', result)
              this.allDone(result)
            })
          } else {
            this.allDone(result)
          }
        });
      });
    });
  }
  onDevice(info) {
    console.log('UPNP', 'found an internet gateway device', info)
    let device = new GatewayDevice(info)
    device.getDescription(function () {
      this.devices.push(device)
    }.bind(this))
  }
  getWANServiceInfo() {
    let infos = []
    for (let i = 0; i < this.devices.length; i++) {
      let services = this.devices[i].getService(this.desiredServices)
      if (services.length > 0) {
        for (let j = 0; j < services.length; j++) {
          infos.push({
            service: services[j],
            device: this.devices[i]
          })
        }
      }
    }
    //console.log('found WAN services',infos)
    return infos
  }
  addMapping(port, prot, callback) {
    this.changeMapping(port, prot, 1, callback)
  }
  removeMapping(port, prot, callback) {
    this.changeMapping(port, prot, 0, callback)
  }
  changeMapping(port, prot, enabled, callback) {
    if (!this.validGateway) {
      callback()
    } else {
      let onresult = (evt) => {
        if (evt.target.code == 200) {
          let resp = evt.target.responseXML.documentElement.querySelector(enabled ? 'AddPortMappingResponse' : 'DeletePortMappingResponse')
          if (resp) {
            callback(this.flatParseNode(resp))
          } else {
            callback({ error: 'unknown', evt: evt })
          }
        } else {
          // maybe parse out the error all nice?
          callback({ error: evt.target.code, evt: evt })
        }
      }
      let externalPort = port
      let args = [];
      if (enabled) {
        args = [
          ['NewEnabled', enabled],
          ['NewExternalPort', externalPort],
          ['NewInternalClient', this.getInternalAddress()],
          ['NewInternalPort', port],
          ['NewLeaseDuration', 0],
          ['NewPortMappingDescription', this.name],
          ['NewProtocol', prot],
          ['NewRemoteHost', '']
        ]
      } else {
        args = [
          //						['NewEnabled',enabled],
          ['NewExternalPort', externalPort],
          //						['NewInternalClient',this.getInternalAddress()],
          //						['NewInternalPort',port],
          ['NewProtocol', prot],
          ['NewRemoteHost', '']
        ]
      }
      this.validGateway.device.runService(this.validGateway.service,
        enabled ? 'AddPortMapping' : 'DeletePortMapping',
        args, onresult)
    }
  }
  getMappings(callback) {
    if (!this.validGateway) {
      callback()
    } else {
      let info = this.validGateway
      let idx = 0
      let allmappings = []

      let oneResult = (evt) => {
        if (evt.target.code === 200) {
          let resp = evt.target.responseXML.querySelector('GetGenericPortMappingEntryResponse');
          let mapping = this.flatParseNode(resp);
          allmappings.push(mapping);
          getOne();
        } else {
          callback(allmappings);
        }
      }

      let getOne = () => {
        info.device.runService(info.service, 'GetGenericPortMappingEntry', [['NewPortMappingIndex', idx++]], oneResult);
      }
      getOne();
    }
  }
  getIP(callback) {
    let infos = this.getWANServiceInfo();
    let foundIP = null;
    let returned = 0;

    function oneResult(info, evt) {
      let doc = evt.target.responseXML; // doc undefined sometimes
      let ipelt = doc.documentElement.querySelector('NewExternalIPAddress');
      let ip = ipelt ? ipelt.innerHTML : null;

      returned++;
      info.device.externalIP = ip;
      if (ip) {
        foundIP = ip;
        this.validGateway = info;
      }

      if (returned === infos.length) {
        callback(foundIP);
      }
    }

    if (infos && infos.length > 0) {
      for (let i = 0; i < infos.length; i++) {
        let info = infos[i]
        info.device.runService(info.service, 'GetExternalIPAddress', [], oneResult.bind(this, info))
      }
    } else {
      callback(null)
    }
  }
}
export class GatewayDevice {
  description_url;
  url;
  services = [];
  devices = [];
  attributes = null;
  externalIP = null;
  constructor(
    public info) {
    this.description_url = info.headers.location
    this.url = new URL(this.description_url)
    this.services = []
    this.devices = []
    this.attributes = null
    this.externalIP = null
  }
  runService(service, command, args, callback) {
    let xhr = new ChromeSocketXMLHttpRequest();
    let url = this.url.origin + service.controlURL
    let body = '<?xml version="1.0"?>' +
      '<s:Envelope ' +
      'xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" ' +
      's:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
      '<s:Body>' +
      '<u:' + command + ' xmlns:u=' +
      JSON.stringify(service.serviceType) + '>' +
      args.map(function (args) {
        return '<' + args[0] + '>' +
          (args[1] === undefined ? '' : args[1]) +
          '</' + args[0] + '>';
      }).join('') +
      '</u:' + command + '>' +
      '</s:Body>' +
      '</s:Envelope>';
    //console.log('req body',body)
    let payload = new TextEncoder('utf-8').encode(body, undefined).buffer
    let headers = {
      'content-type': 'text/xml; charset="utf-8"',
      'connection': 'close',
      'SOAPAction': JSON.stringify(service.serviceType) + '#' + command
    }
    for (let k in headers) {
      xhr.setRequestHeader(k, headers[k])
    }
    xhr.open("POST", url, true)
    xhr.setRequestHeader('connection', 'close')
    xhr.responseType = 'xml'
    xhr.send(payload)
    xhr.onload = xhr.onerror = xhr.ontimeout = callback
  }
  getDescription(callback) {
    let xhr = new ChromeSocketXMLHttpRequest();
    console.log('UPNP', 'query', this.description_url)
    xhr.open("GET", this.description_url, true)
    xhr.setRequestHeader('connection', 'close')
    xhr.responseType = 'xml'
    function onload(evt) {
      if (evt.target.code == 200) {
        let doc = evt.target.responseXML

        let devices = doc.documentElement.querySelectorAll('device')
        for (let i = 0; i < devices.length; i++) {
          this.devices.push(this.flatParseNode(devices[i]))
        }

        let services = doc.documentElement.querySelectorAll('service')
        for (let i = 0; i < services.length; i++) {
          this.services.push(this.flatParseNode(services[i]))
        }

      }
      //console.log('got service info',this)
      callback()
    }
    xhr.onload = xhr.onerror = xhr.ontimeout = onload.bind(this)
    xhr.send(undefined)
  }
  getService(desired) {
    let matches = this.services.filter(function (service) {
      return desired.indexOf(service.serviceType) != -1
    })
    return matches
  }
}

export class SSDP {
  port = 8888;
  wantUDP = true;
  searchtime;
  multicast = '239.255.255.250'
  ssdpPort = 1900
  boundPort = null
  searchdevice = 'urn:schemas-upnp-org:device:InternetGatewayDevice:1'
  _onReceive: () => void;
  sockMap = {}
  lastError = null
  searching = false
  _event_listeners = {}
  constructor(private upnp: UPNP, opts) {
    this.port = opts.port
    this.wantUDP = opts.udp === undefined ? true : opts.udp
    this.searchtime = opts.searchtime
    this.multicast = '239.255.255.250'
    this.ssdpPort = 1900
    this.boundPort = null
    this.searchdevice = 'urn:schemas-upnp-org:device:InternetGatewayDevice:1'
    this._onReceive = this.onReceive.bind(this)
    chrome.sockets.udp.onReceive.addListener(this._onReceive)
    chrome.sockets.udp.onReceiveError.addListener(this._onReceive)
    this.sockMap = {}
    this.lastError = null
    this.searching = false
    this._event_listeners = {}
  }

  addEventListener(name, callback) {
    if (!this._event_listeners[name]) {
      this._event_listeners[name] = []
    }
    this._event_listeners[name].push(callback)
  }
  trigger(name, data) {
    let cbs = this._event_listeners[name]
    if (cbs) {
      cbs.forEach(function (cb) { cb(data) })
    }
  }
  onReceive(result) {
    let state = this.sockMap[result.socketId]
    let resp = new TextDecoder('utf-8', undefined).decode(result.data, undefined)
    if (!(resp.startsWith("HTTP") || resp.startsWith("NOTIFY"))) { return }
    let lines = resp.split('\r\n')
    let headers = {}
    // Parse headers from lines to hashmap
    lines.forEach((line) => {
      line.replace(/^([^:]*)\s*:\s*(.*)$/, (_l, key, value): string => {
        headers[key.toLowerCase()] = value;
        return value;
      });
    })
    if (headers['st'] == this.searchdevice) {
      //console.log('SSDP response',headers,result)
      let device = {
        remoteAddress: result.remoteAddress,
        remotePort: result.remotePort,
        socketId: 977,
        headers: headers
      }
      this.trigger('device', device)
    }
  }
  error(data) {
    this.lastError = data
    console.log('UPNP', "error", data)
    this.searching = false
    // clear out all sockets in sockmap
    this.cleanup()
    if (this.upnp.allDone) this.upnp.allDone(false)
  }
  cleanup() {
    for (let socketId in this.sockMap) {
      chrome.sockets.udp.close(parseInt(socketId))
    }
    this.sockMap = {}
    chrome.sockets.udp.onReceive.removeListener(this._onReceive)
    chrome.sockets.udp.onReceiveError.removeListener(this._onReceive)
  }
  stopsearch() {
    console.log('UPNP', 'stopping ssdp search')
    // stop searching, kill all sockets
    this.searching = false
    this.cleanup()
    this.trigger('stop', undefined)
  }
  search(opts) {
    if (this.searching) { return }
    setTimeout(this.stopsearch.bind(this), this.searchtime)
    let state = { opts: opts, sockInfo: null }
    chrome.sockets.udp.create((sockInfo) => {
      state.sockInfo = sockInfo
      this.sockMap[sockInfo.socketId] = state
      chrome.sockets.udp.setMulticastTimeToLive(sockInfo.socketId, 1, (result) => {
        if (result < 0) {
          this.error({ error: 'ttl', code: result })
        } else {
          chrome.sockets.udp.bind(state.sockInfo.socketId, '0.0.0.0', 0, this.onbound.bind(this, state))
        }
      });
    });
  }
  onbound(state, result) {
    if (result < 0) {
      this.error({ error: 'bind error', code: result })
      return
    }
    chrome.sockets.udp.getInfo(state.sockInfo.socketId, this.onInfo.bind(this, state))
  }
  onInfo(state, info) {
    let lasterr = chrome.runtime.lastError
    if (lasterr) {
      // socket was deleted in the meantime?
      this.error(lasterr)
      return
    }
    this.boundPort = info.localPort
    //console.log('UPNP','bound')
    chrome.sockets.udp.joinGroup(state.sockInfo.socketId, this.multicast, this.onjoined.bind(this, state))
  }
  onjoined(state, result) {
    let lasterr = chrome.runtime.lastError
    if (lasterr) {
      this.error(lasterr)
      return
    }
    if (result < 0) {
      this.error({ error: 'join multicast', code: result })
      return
    }
    let req = 'M-SEARCH * HTTP/1.1\r\n' +
      'HOST: ' + this.multicast + ':' + this.ssdpPort + '\r\n' +
      'MAN: "ssdp:discover"\r\n' +
      'MX: 1\r\n' +
      'ST: ' + this.searchdevice + '\r\n' +
      '\r\n'

    chrome.sockets.udp.send(state.sockInfo.socketId, new TextEncoder('utf-8').encode(req, undefined).buffer, this.multicast, this.ssdpPort, this.onsend.bind(this))
    //console.log('UPNP', 'sending to',this.multicast,this.ssdpPort)
  }
  onsend(result) {
    //console.log('UPNP', 'sent result',result)
  }
}
