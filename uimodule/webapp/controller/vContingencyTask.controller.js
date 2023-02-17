sap.ui.define(
    [
    "com/bmore/inveweb/controller/BaseController",
    "sap/ui/core/Fragment",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Item",
    "sap/ui/core/MessageType",
    "sap/m/MessageBox"
    ],
    function (Controller,Fragment,BusyIndicator,JSONModel,Item,MessageType,MessageBox) {
    "use strict";

    return Controller.extend("com.bmore.inveweb.controller.vContingencyTask", {
    onInit: function() {
        // Code to execute every time view is displayed
        this.getView().addDelegate({
                
            onBeforeShow: function(evt) {    
                this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
                BusyIndicator.hide();

                this.cleanView();

            }.bind(this)
        });		
    },

    downloadTask: async function(){
		
		var tokenObject = new Object();
		tokenObject.loginId = this.getUserId();
		tokenObject.loginPass = null;
		tokenObject.loginLang ="ES";
		tokenObject.relationUUID = null;
		 
		var routeBean = new Object();
		routeBean.routeId = null;
		routeBean.bukrs = 7;
		routeBean.werks = null;
		routeBean.rdesc = null;
		routeBean.type = null//'0001';
		routeBean.positions = null;
		routeBean.groups = null;
		 
		var request = new Object();
		request.tokenObject = tokenObject;
		request.lsObject = null;
		//  console.log("Request",request);
		var arr = [];
		var obj;
		
        console.log(request);
        const json = await this.execService(InveServices.GET_ROUTES_BY_USER, request, 'getRoutesByUser', this.showLog);
        if (json){
            console.log(json);
			//No session, so redirect to login
			if(json.abstractResult.resultId == -106){
				this.navTo("Login");
				return;
			}else if(json.abstractResult.resultId == -107){
				jQuery.sap.require("sap.m.MessageBox");	        			
				sap.m.MessageBox.show(json.abstractResult.resultMsgAbs,					
							            sap.m.MessageBox.Icon.WARNING, "Advertencia");
				BusyIndicator.hide();
			}else if(json.abstractResult.resultId == 1){
					            		
			    var pos = json.lsObject.positions;
				for(let i=0;i<pos.length;i++){
					for(let j=0; j<pos[i].zone.positionsB.length;j++){
						var lgplaValues = this.objectToArray(pos[i].zone.positionsB[j].lgplaValues);
							            		
						for(let k=0;k<lgplaValues.length;k++){
							obj = new Object();
							obj.taskId = json.lsObject.taskId;
							obj.bukrs = json.lsObject.bukrs;
							obj.werks = json.lsObject.werks;
							obj.routeId = pos[i].routeId;
							obj.rdesc = json.lsObject.rdesc;
							obj.secuencyZone = pos[i].secuency;
							obj.lgort = pos[i].lgort;
							obj.positionId = pos[i].positionId;
							obj.zoneId = pos[i].zone.zoneId;
							obj.zdesc = pos[i].zone.zdesc;
							obj.lgtyp = pos[i].zone.positionsB[j].lgtyp;
							obj.pkAsgId = pos[i].zone.positionsB[j].pkAsgId;
							obj.lgpla = pos[i].zone.positionsB[j].lgpla;
							obj.secuencyLgpla = pos[i].zone.positionsB[j].secuency;
									            	
							obj.lgplaValues = lgplaValues[k];
							arr.push(obj);
						}
						if(lgplaValues.length == 0){
							obj = new Object();
							obj.taskId = json.lsObject.taskId;
							obj.bukrs = json.lsObject.bukrs;
							obj.werks = json.lsObject.werks;
							obj.routeId = pos[i].routeId;
							obj.rdesc = json.lsObject.rdesc;
							obj.secuencyZone = pos[i].secuency;
							obj.lgort = pos[i].lgort;
							obj.positionId = pos[i].positionId;
							obj.zoneId = pos[i].zone.zoneId;
							obj.zdesc = pos[i].zone.zdesc;
							obj.lgtyp = pos[i].zone.positionsB[j].lgtyp;
							obj.pkAsgId = pos[i].zone.positionsB[j].pkAsgId;
							obj.lgpla = pos[i].zone.positionsB[j].lgpla;
							obj.secuencyLgpla = pos[i].zone.positionsB[j].secuency;
									            	
							arr.push(obj);
						}           		
					}		            	
				}
					
                BusyIndicator.hide();
				console.log("arr",arr);
				this.csv(arr,json.lsObject.taskId);
			}else{

				jQuery.sap.require("sap.m.MessageBox");	        			
				sap.m.MessageBox.show('Ocurrió un problema al tratar de descargar la tarea',					
							            sap.m.MessageBox.Icon.ERROR, "Error");
				BusyIndicator.hide();
			}
        } else {
            jQuery.sap.require("sap.m.MessageBox");	        			
			sap.m.MessageBox.show(response,					
						            sap.m.MessageBox.Icon.ERROR, "Error");
			BusyIndicator.hide();   
        }
	},

    objectToArray: function(obj){
	    return Object.keys(obj).map(function(key) { return [obj[key].matnr]; });
	},

    csv: function(obj,id){
		
	    if(obj == undefined || obj.length == 0){
		    jQuery.sap.require("sap.m.MessageBox");
        	
        	sap.m.MessageBox.show('Sin información para descargar.',
					                sap.m.MessageBox.Icon.ERROR, "Error");
        	return;
		}
		var model = new sap.ui.model.json.JSONModel();	       	
		model.setData({modelData: obj}); 
	
		jQuery.sap.require("sap.ui.core.util.Export");
		jQuery.sap.require("sap.ui.core.util.ExportTypeCSV");
		
		var oExport = new sap.ui.core.util.Export({

			exportType: new sap.ui.core.util.ExportTypeCSV({
				fileExtension: "csv",
				separatorChar: ","
			}),
			models: model,
			rows: {
				path: "/modelData"
			},
			
			columns: [
			    {name: "Id Tarea",template: {content: "{taskId}"}}, 
                {name: "Sociedad",template: {content: "{bukrs}"}}, 
                {name: "Centro",template: {content: "{werks}"}}, 
                {name: "Id Ruta",template: {content: "{routeId}"}}, 
                {name: "Descripción Ruta",template: {content: "{rdesc}"}}, 
                {name: "Almacén", template: {content: "{lgort}"}}, 
                {name: "Id Posicion", template: {content: "{positionId}"}}, 
                {name: "Tipo de Almacén", template: {content: "{lgtyp}"}}, 
                {name: "Id de Relación", template: {content: "{pkAsgId}"}}, 
                {name: "Id Zona",template: {content: "{zoneId}"}}, 
                {name: "Descripción Zona",template: {content: "{zdesc}"}}, 
                {name: "Secuencia Zona",template: {content: "{secuencyZone}"}}, 
                {name: "Carril", template: {content: "{lgpla}"}}, 
                {name: "Secuencia Carril",template: {content: "{secuencyLgpla}"}}, 
                {name: "Material", template: { content: "{lgplaValues}" }}, 
                {name: "U.M.B. (Cajas)", template: { content: "" }}
			]
		});
		oExport.saveFile("Downloaded-"+id).catch(function(oError) {
			console.error("Error al exportar csv");
		}).then(function() {
			oExport.destroy();
		}); 
	
	},

    openFilePicker: function(){
		$('#fileContingencyTask').click();	
	},

    uploadTemplate:	function(){				
		
	    var form = new FormData();	
		var file = $('#fileContingencyTask').prop('files')[0];
		var allowedFiles=['csv'];
		var ext = file.name.split('.').pop().toLowerCase();
		var that = this;
		
		// Check if is an allowed file
		if(allowedFiles.indexOf(ext) == -1){
			this.toast("Tipo de archivo no permitido, " +
					"solo se permiten archivos de tipo: " +  allowedFiles, '20em');
			$('#fileContingencyTask').val("");
			return;
		}
				
	    var reader = new FileReader();

	    // Read file into memory
	    reader.readAsText(file, 'ISO-8859-1');

	    // Handle errors load
	    reader.onload = loadHandler;
	    reader.onerror = errorHandler;

	    function loadHandler(event) {

	      var csv = event.target.result;
	      processData(csv);

	    }

	    function processData(csv) {
	    	
	        var allTextLines = csv.split(/\r\n|\n/);
	        allTextLines.splice(-1);
	        var data;
	        var object;
	        var arrTable = [];	        
	        var size = allTextLines.length;
//			Validaciones de tarea, sociedad y centro para que no vengan vacios
			if(allTextLines[1].split(',')[0].length == 0){
				that.message("La columna 'Id Tarea' del excel NO puede estar vacia",sap.ui.core.MessageType.Error);
	    		
				setTimeout(function(){	                		
					that.byId("messagesBox").getItems()[0].close();            		
	        	}.bind(this), 6000);
				
				return;
			}
			
			if(allTextLines[1].split(',')[1].length == 0){
				that.message("La columna 'Sociedad' del excel NO puede estar vacia",sap.ui.core.MessageType.Error);
	    		
				setTimeout(function(){	                		
					that.byId("messagesBox").getItems()[0].close();            		
	        	}.bind(this), 6000);
				
				return;
			}
			if(allTextLines[1].split(',')[2].length == 0){
				that.message("La columna 'Centro' del excel NO puede estar vacia",sap.ui.core.MessageType.Error);
	    		
				setTimeout(function(){	                		
					that.byId("messagesBox").getItems()[0].close();            		
	        	}.bind(this), 6000);
				
				return;
			}
			
			if(allTextLines[1].split(',')[3].length == 0){
				that.message("La columna 'Id ruta' del excel NO puede estar vacia",sap.ui.core.MessageType.Error);
	    		
				setTimeout(function(){	                		
					that.byId("messagesBox").getItems()[0].close();            		
	        	}.bind(this), 6000);
				
				return;
			}
			
//			FIN Validaciones de tarea, sociedad y centro para que no vengan vacios
			
	        that.byId("idTask").setValue(allTextLines[1].split(',')[0]);
	        that.byId("idTask").setVisible(true);
			for (let i = 1; i < allTextLines.length; i++) {
				
	        	data = allTextLines[i].split(',');
	        	if(data.length > 0){
	        		///////////
	        		if(data[14] == undefined || data[14] === ''){
	        			continue;
	        		}
	        		///////////
	        		object = new Object();
		        	object.bukrs = data[1];		        	
		        	object.werks = data[2];
		        	object.routeId = data[3];
		        	object.rdesc = data[4];
		        	object.lgort = data[5];
		        	if(data[6].length > 0){
		        		object.positionId = data[6];
		        	}else{
		        		that.message("La columna 'Id Posición' del excel NO puede ser vacia",sap.ui.core.MessageType.Error);
		        		
		    			setTimeout(function(){	                		
		    				that.byId("messagesBox").getItems()[0].close();            		
		            	}.bind(this), 6000);
		    			
		    			return;
		        	}
		        	
		        	object.lgtyp = data[7];
		        	if(data[8].length > 0){
		        		object.pkAsgId = data[8];
		        	}else{
		        		that.message("La columna 'Id de Relación' del excel NO puede ser vacia",sap.ui.core.MessageType.Error);
		        		
		    			setTimeout(function(){	                		
		    				that.byId("messagesBox").getItems()[0].close();            		
		            	}.bind(this), 6000);
		    			
		    			return;
		        	}
		        	
		        	if(data[9].length > 0){
		        		object.zoneId = data[9];
		        	}else{
		        		that.message("La columna 'Id Zona' del excel NO puede ser vacia",sap.ui.core.MessageType.Error);
		        		
		    			setTimeout(function(){	                		
		    				that.byId("messagesBox").getItems()[0].close();            		
		            	}.bind(this), 6000);
		    			
		    			return;
		        	}
		        	
		        	object.zdesc = data[10];
		        	object.secuencyZone = data[11];
		        	if(data[12].length > 0){
		        		object.lgpla = data[12];
		        	}else{
		        		that.message("La columna 'Carril' del excel NO puede ser vacia",sap.ui.core.MessageType.Error);
		        		
		    			setTimeout(function(){	                		
		    				that.byId("messagesBox").getItems()[0].close();            		
		            	}.bind(this), 6000);
		    			
		    			return;
		        	}
		        	
		        	object.secuencyLgpla = data[13];
		        	object.matnr = data[14];
		        	
		        	if(data[15] != null && data[15] != undefined && data[15].length > 0){
		        		if(!isNaN(data[15])){
		        			object.um = data[15];
		        		}else{
		        			object.um = 0;
		        		}
		        		
		        	}else{
		    			object.um = 0;
		        	}
		        	
		        	arrTable.push(object);
	        	}		        	
	        }
			
			console.log(arrTable);
			let oModel = new JSONModel(arrTable);
			//oModel.setData({modelData: arrTable});
			
			let oTable = that.byId("oTable");
			oTable.setModel(oModel, "oModel");
			//oTable.bindRows("/modelData");			
			
			var message = 'Carga concluida con éxito.'; 
    		that.message(message, sap.ui.core.MessageType.Success);
    		that.byId("bDelete").setEnabled(true);
    		that.byId("bSend").setEnabled(true);
			oTable.setVisible(true);
    		setTimeout(function(){	                		
    			that.byId("messagesBox").getItems()[0].close();            		
    		}, 5000);				        	        	                
	    }

	    function errorHandler(evt) {

	    	if(evt.target.error.name == "NotReadableError") {

	    		jQuery.sap.require("sap.m.MessageBox");	        			
				sap.m.MessageBox.show('No se puede leer el archivo.',					
						sap.m.MessageBox.Icon.ERROR, "Error");
	      }

	    }		
    	
		$('#fileContingencyTask').val("");
						
	},

    message: function(message, type){
		
		var that = this;
		
		var mTrip = new sap.m.MessageStrip({			
			text : message, // string
			type : type, // sap.ui.core.MessageType
			showIcon : true, // boolean
			showCloseButton : true, // boolean
			close: function(){
				that.eraseNotification();	
			},			
		});
		    	
    	var messagesBox = this.byId("messagesBox");
    	messagesBox.removeAllItems();
    	messagesBox.addItem(mTrip);
    	
    	this.byId("vbFrame").setVisible(true);	
    	
    	setTimeout(function(){
    		var scrtollTo = that.byId("messagesBox");
        	that.byId("pContingencyTask").scrollToElement(scrtollTo);
    	},50);
		
	},

    returnAction : function() {
        
        this.flag = false;
        window.history.go(-1);
        
    },

    cleanView: function(){

		this.eraseNotification();

		// Set the state for main controls
		//this.byId("bDownload").setEnabled(true);
		//this.byId("bUpload").setEnabled(true);
		this.byId("bSend").setEnabled(false);
		this.byId("bDelete").setEnabled(false);
		
		// Clean form
		this.byId("idTask").setValue(null);
		this.byId("idTask").setVisible(false);

		// Empty table
		let oModel = new JSONModel([]);
			
		let oTable = this.byId("oTable");
		oTable.setModel(oModel,"oModel");
		oTable.getModel("oModel").refresh(true);	
    },
    
    eraseNotification : function() {
        this.byId("vbFrame").setVisible(false);	
    },

    removeTask: function(){
		jQuery.sap.require("sap.m.MessageBox");
		var that = this;
		sap.m.MessageBox.confirm(
				 "¿Desea borrar los datos cargados?", {
			          icon: sap.m.MessageBox.Icon.QUESTION,
			          actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
			          onClose: function(oAction) { 
			        	  
			        	if(oAction == 'YES'){
			        		let oModel = new JSONModel([]);
			        		//oModel.setData({modelData: []});
			        		
			        		let oTable = that.byId("oTable");
			        		oTable.setModel(oModel, "oModel");
							oTable.getModel("oModel").refresh(true);
			        		//oTable.bindRows("/modelData");
			        		that.byId("idTask").setValue(null) ;
			        		that.byId("bDelete").setEnabled(false);
			        		that.byId("bSend").setEnabled(false);
			        	}  			        	  			        	  
			        }						
				}
			);		
	},
	
	sendTask: async function(){
		
		var data =  this.byId("oTable").getModel("oModel").getData();
		var object;
		var arr = [];
		
		for(let i=0; i<data.length; i++){
			
			object = new Object();
			object.taskId = this.byId("idTask").getValue();
			object.bukrs = data[i].bukrs ;
			object.werks = data[i].werks;
			object.routeId = data[i].routeId;
			object.lgort = data[i].lgort;
			object.positionId = data[i].positionId;
			object.lgtyp = data[i].lgtyp;
			object.pkAsgId = data[i].pkAsgId;
			object.zoneId = data[i].zoneId;
			object.zoneSecuency = data[i].secuencyZone;
			object.lgpla = data[i].lgpla;
			object.lgplaSecuency = data[i].secuencyLgpla;
			object.matnr = data[i].matnr;
			object.totalConverted = data[i].um;

        	arr.push(object); 
		}
		
		var request = new Object();
		request.tokenObject = null;
		request.lsObject = arr;
		
		console.log(request);
        const json = await this.execService(InveServices.ADD_CONTINGENCY_TASK_COUNT, request, "newContingencyTaskCount", this.showLog);
        if (json){
            console.log("json",json);
            //No session, so redirect to login
            if(json.abstractResult.resultId == -106){
				this.navTo("Login");
				return;
            }
            		            	
        	if(json.abstractResult.resultId != 1){	
        			
        		jQuery.sap.require("sap.m.MessageBox");
	            	
	            sap.m.MessageBox.show(json.abstractResult.resultMsgAbs,
        					sap.m.MessageBox.Icon.ERROR, "Error");
        			
	    		BusyIndicator.hide();
        			        			
            }else{
        		//console.log("addTask-lsObject",json.lsObject);
            	BusyIndicator.hide();
        				
        		this.message('Tarea '+this.byId("idTask").getValue()+' enviada exitosamente',sap.ui.core.MessageType.Success);
        		//Limpiando campos
                let oModel = new JSONModel([]);
		        //oModel.setData({modelData: []});
                let oTable = this.byId("oTable");
		        oTable.setModel(oModel, "oModel");
				oTable.getModel("oModel").refresh(true);
		        //oTable.bindRows("/modelData");
		        this.byId("idTask").setValue(null) ;
		        this.byId("bDelete").setEnabled(false);
		        this.byId("bSend").setEnabled(false);
            			            		
            }
        } else {
            jQuery.sap.require("sap.m.MessageBox");
            	
            sap.m.MessageBox.show(response,
    					sap.m.MessageBox.Icon.ERROR, "Error");
    			
    		BusyIndicator.hide();
        }
			
	},

});
}
);
