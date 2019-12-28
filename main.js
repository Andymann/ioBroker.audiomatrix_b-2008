"use strict";

/*
 * Created with @iobroker/create-adapter v1.18.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
// const fs = require("fs");
var net = require('net');
var matrix;
var query = null;
var bConnection = false;
var bWaitingForResponse = false;
var bQueryDone = false;
var bQueryInProgress=false;
var iMaxTryCounter = 0;
var iMaxTimeoutCounter = 0;
var arrCMD = [];
var lastCMD;
var in_msg = "";
var parentThis;
var cmdConnect =    new Buffer([0x5A, 0xA5, 0x14, 0x00, 0x40, 0x00, 0x00, 0x00, 0x0A, 0x5D]);



class AudiomatrixB2008 extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "audiomatrix_b-2008",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
		
		parentThis = this;
		
	}
	
	toHexString(byteArray) {
        return Array.from(byteArray, function(byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }

	initMatrix(){
        this.log.info('initMatrix().');
        this.connectMatrix();                                                  
    }


	processCMD(){
		if(!bWaitingForResponse){
            if(arrCMD.length>0){
                this.log.debug('AudioMatrix: processCMD: bWaitingForResponse==FALSE, arrCMD.length=' +arrCMD.length.toString());
                bWaitingForResponse=true;
                var tmp = arrCMD.shift();
                this.log.debug('AudioMatrix: processCMD: next CMD=' + this.toHexString(tmp) + ' arrCMD.length rest=' +arrCMD.length.toString());
                lastCMD = tmp;
                setTimeout(function() {
                    matrix.write(tmp);           
                }, 100);
            }else{
                this.log.debug('AudioMatrix: processCMD: bWaitingForResponse==FALSE, arrCMD ist leer. Kein Problem');
            }
        }else{
            this.log.debug('AudioMatrix: processCMD: bWaitingForResponse==TRUE. Nichts machen');
        }

        //----Anzeige der Quelength auf der Oberflaeche
//        this.setStateAsync('queuelength', { val: arrCMD.length, ack: true });
	}
	
	pingMatrix(){
		this.log.info('AudioMatrix: pingMatrix()' );
//        arrCMD.push(cmdConnect);
//        iMaxTryCounter = 3;
//        this.processCMD();
	}
	
	queryMatrix(){
		this.log.info('AudioMatrix: queryMatrix(). arrCMD.length vorher=' + arrCMD.length.toString());                      
//        bQueryInProgress  = true;
//		this.setState('queryState', true, true);
//        arrQuery.forEach(function(item, index, array) {                             
//            arrCMD.push(item);
//        });
//        this.log.info('AudioMatrix: queryMatrix(). arrCMD.length hinterher=' + arrCMD.length.toString());
//        iMaxTryCounter = 3;
//        this.processCMD();
	}
	
	reconnect(){
		this.log.info('AudioMatrix: reconnectMatrix()');
//        bConnection = false;
//        clearInterval(query);
//        clearTimeout(recnt);
//        matrix.destroy();

//        this.log.info('AudioMatrix: Reconnect after 15 sec...');
//        this.setState('info.connection', false, true);
        //this.setConnState(false, false);
//        recnt = setTimeout(function() {
//            parentThis.initmatrix();
//        }, 15000);
	}
	
	
	  _connect(){
		this.log.info("_connect()");
//                if(!tabu){             //----Damit nicht gepolled wird, wenn gerade etwas anderes stattfindet.
                    if(bConnection==false){
						if(bWaitingForResponse==false){
	                        parentThis.log.info('AudioMatrix: _connect().connection==false, sending CMDCONNECT:' + parentThis.toHexString(cmdConnect));
        	                arrCMD.push(cmdConnect);
        	                iMaxTryCounter = 3;
        	                parentThis.processCMD();
						}else{
							parentThis.log.info('AudioMatrix: _connect().connection==false, bWaitingForResponse==false; nichts machen');
						}
                    }else{
                        if(bQueryDone==true){
                            if(arrCMD.length==0){
	                    	    parentThis.log.debug('AudioMatrix: _connect().connection==true, bQueryDone==TRUE, idle, pinging Matrix');
        	                	parentThis.pingMatrix();                                                                                                          
                            }else{
                                parentThis.log.debug('AudioMatrix: _connect().connection==true, bQueryDone==TRUE, arrCMD.length>0; idle, aber KEIN ping auf Matrix');
                            }
                        }else{
                            if(!bQueryInProgress){
                                parentThis.log.debug('AudioMatrix: _connect().connection==true, bQueryDone==FALSE, idle, query Matrix');                            
                                parentThis.queryMatrix();
                            }
                        }                                                                                           
                    }

                    //----Intervall fuer Befehle, Timeouts, etc
                    setTimeout(function(){
                        //parentThis.log.info('AudioMatrix: connectMatrix(): kleines Timeout');
                        if(bWaitingForResponse==true){
                            if(bQueryInProgress==false){
								if(iMaxTryCounter>0){
									//----Es kann passieren, dass man direkt NACH dem Senden eines Befehls an die Matrix und VOR der Antwort hier landet.
									//----deswegen wird erstmal der MaxTryCounter heruntergesetzt und -sofern nichts kommt- bis zum naechsten Timeout gewartet.
									//----Wenn iMaxTryCounter==0 ist, koennen wir von einem Problem ausgehen
									parentThis.log.info('AudioMatrix: _connect(): kleines Timeout. bWaitingForResponse==TRUE iMaxTryCounter==' + iMaxTryCounter.toString() );
									parentThis.log.info('AudioMatrix: _connect(): kleines Timeout. lastCMD =' + parentThis.toHexString(lastCMD) + ' nichts tun, noch warten');
									iMaxTryCounter--;   
//									parentThis.setState('minorProblem', true, true);
								}else{
									if(iMaxTimeoutCounter<3){
										parentThis.log.info('AudioMatrix: _connect() in_msg: kleines Timeout. bWaitingForResponse==TRUE iMaxTryCounter==0. Erneutes Senden von ' + parentThis.toHexString(lastCMD));
										iMaxTimeoutCounter++;
										iMaxTryCounter=3;
										if(lastCMD !== undefined){
											setTimeout(function() {
												matrix.write(lastCMD);            
											}, 100);
										}
									}else{
										parentThis.log.error('AudioMatrix: _connect() in_msg: kleines Timeout. bWaitingForResponse==TRUE iMaxTryCounter==0. Erneutes Senden von ' + parentThis.toHexString(lastCMD) + 'schlug mehrfach fehl');
										iMaxTimeoutCounter=0;
										parentThis.log.error('AudioMatrix: _connect() in_msg: kleines Timeout. bWaitingForResponse==TRUE iMaxTryCounter==0');
										//parentThis.log.error('WIE reagieren wir hier drauf? Was ist, wenn ein Befehl nicht umgesetzt werden konnte?');
										bWaitingForResponse=false;
										lastCMD = '';
										in_msg = '';
										arrCMD = [];
										parentThis.reconnect();
									}
								}
                            }else{
//								parentThis.setState('minorProblem', true, true);
								if(bConnection==true){
                                    parentThis.log.info('AudioMatrix: _connect(): kleines Timeout. bWaitingForResponse==TRUE, bQueryInProgress==TRUE. Abwarten. iMaxTryCounter==' + iMaxTryCounter.toString() );
                                }else{
                                    //----Fuer den Fall, dass der Verbindungsversuch fehlschlaegt
                                    parentThis.log.info('AudioMatrix: _connect(): kleines Timeout. bWaitingForResponse==TRUE, bQueryInProgress==TRUE. Connection==FALSE. iMaxTryCounter==' + iMaxTryCounter.toString() );
				    				bWaitingForResponse=false;
                                    iMaxTryCounter--;
                                }
                            }
                        }else{
                            //parentThis.log.debug('AudioMatrix: connectMatrix() in_msg: kleines Timeout. bWaitingForResponse==FALSE, kein Problem');
                        }
                    }, 333/*kleinesIntervall*/);

//                }else{
//                    parentThis.log.debug('AudioMatrix: connectMatrix().Im Ping-Intervall aber tabu==TRUE. Nichts machen.');
//                }
            
		return;
	}
	
	connectMatrix(cb){
        var host = this.config.host;
        var port = this.config.port;
        
        bQueryDone = false;
        bQueryInProgress=false;

//        bQueryComplete_Routing = false;
//        bQueryComplete_Input = false;
//        bQueryComplete_Output = false;

	
        this.log.info('connectMatrix(): AudioMatrix: connecting to: ' + this.config.host + ':' + this.config.port);

        matrix = new net.Socket();
        matrix.connect(this.config.port, this.config.host, function() {
            clearInterval(query);
            this.log.info("connectMatrix(): sofort-Connect");
            parentThis._connect();
            query = setInterval(function(){parentThis._connect()}, 10000);

            if(cb){
                cb();
            }                             
        });

        matrix.on('data', function(chunk) {
/*
            in_msg += parentThis.toHexString(chunk);

            if(bWaitingForResponse==true){                                                                          
                if((in_msg.length >= 26) && (in_msg.includes('f0'))){
                    //parentThis.log.debug('AudioMatrix: matrix.on data(); in_msg ist lang genug und enthaelt f0:' + in_msg);
                    var iStartPos = in_msg.indexOf('f0');
                    if(in_msg.toLowerCase().substring(iStartPos+24,iStartPos+26)=='f7'){                                                                                              
                        bWaitingForResponse = false;
                        var tmpMSG = in_msg.toLowerCase().substring(iStartPos,iStartPos+26);
                        parentThis.log.debug('AudioMatrix: matrix.on data(); filtered:' + tmpMSG);
                        parentThis.bWaitingForResponse = false;
                        parentThis.parseMsg(tmpMSG);
                        in_msg = '';
                        lastCMD = '';
                        //iMaxTryCounter = 3;
                        iMaxTimeoutCounter = 0;
                        parentThis.processCMD();                        
                    }else{
                        //----Irgendwie vergniesgnaddelt
                        parentThis.log.info('AudioMatrix: matrix.on data: Fehlerhafte oder inkomplette Daten empfangen:' + in_msg);                                                                                                   
                    }                                                                                           
                }
            }else{
                parentThis.log.info('AudioMatrix: matrix.on data(): incomming aber bWaitingForResponse==FALSE; in_msg:' + in_msg);
            }

            if(in_msg.length > 60){
                //----Just in case
                in_msg = '';
            }
*/
        });

        matrix.on('timeout', function(e) {
            //if (e.code == "ENOTFOUND" || e.code == "ECONNREFUSED" || e.code == "ETIMEDOUT") {
            //            matrix.destroy();
            //}
            parentThis.log.error('AudioMatrix TIMEOUT');
            //parentThis.connection=false;
            //parentThis.setConnState(false, true);
//            parentThis.reconnect();
        });

        matrix.on('error', function(e) {
            if (e.code == "ENOTFOUND" || e.code == "ECONNREFUSED" || e.code == "ETIMEDOUT") {
                matrix.destroy();
            }
            parentThis.log.error(e);
//            parentThis.reconnect();
        });

        matrix.on('close', function(e) {
            if(bConnection){
                parentThis.log.error('AudioMatrix closed');
            }
            //parentThis.reconnect();
        });

        matrix.on('disconnect', function(e) {
            parentThis.log.error('AudioMatrix disconnected');
//            parentThis.reconnect();
        });

        matrix.on('end', function(e) {
            parentThis.log.error('AudioMatrix ended');
            //parentThis.setConnState(false, true);                                            
        });
    }

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info("config option1: " + this.config.option1);
		this.log.info("config option2: " + this.config.option2);

		this.log.info("Config Host:" + this.config.host);
		this.log.info("Config Port:" + this.config.port);
		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectAsync("testVariable", {
			type: "state",
			common: {
				name: "testVariable",
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		// in this template all states changes inside the adapters namespace are subscribed
		this.subscribeStates("*");

		/*
		setState examples
		you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw ioboker: " + result);

		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result);
		
		//----
		this.initMatrix();
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info("cleaned everything up...");
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new AudiomatrixB2008(options);
} else {
	// otherwise start the instance directly
	new AudiomatrixB2008();
}