sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/Fragment",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/ui/model/Filter",
	  "sap/ui/model/FilterOperator",
	  "sap/ui/model/FilterType",
	  "sap/ui/core/Item",
	  "sap/ui/core/MessageType",
	  "sap/m/MessageBox",
	  "sap/ui/core/util/Export",
      "sap/ui/core/util/ExportTypeCSV",
	],
	function (Controller,Fragment,BusyIndicator,JSONModel,Filter,FilterOperator,FilterType,Item,MessageType,MessageBox,Export,ExportTypeCSV) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vZone", {

	onInit: function() {
		 
		this.flag = false;
		
		// Code to execute every time view is displayed
		this.getView().addDelegate({
				
			onBeforeShow: function(evt) {    
				this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");	
				BusyIndicator.hide();
				
				
				if(!this.flag){
					this.cleanView();
					this.backupRecord = new Object();
					this.setBukrsAndWerks();
				}			
	        }.bind(this)
	    });
		
	},
	

 onAfterRendering: function() {
	setTimeout(function() {
		$("#vZone--zoneId-inner").attr("readonly", "readonly");
	},500);
 },

	
	returnAction : function() {
		
		this.flag = false;
		window.history.go(-1);
		
	},
	
	setBukrsAndWerks: async function(){
		let cmbxBukrs = await this.loadSocieties();
		if(!this.ADMIN_ROLE){
			let bukrs = this.getBukrs();
			cmbxBukrs.setSelectedKey(bukrs);
			cmbxBukrs.setEnabled(false);
			
			
			let werksCmb = this.byId("werks");
						
			if(werksCmb.getItems().length == 0){
				
				await this.loadWerks();
			}
			
			let werks = this.getWerks();
			werksCmb.setSelectedKey(werks);
			werksCmb.setEnabled(false);
		}
	},
			
	cleanView: function(){
		this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
		this.backupRecord = {};		
		this.eraseNotification();		
		this.setOnEdit(false);
		
		// Set the state for main controls
		this.byId("bNew").setEnabled(true);
		this.byId("bEdit").setEnabled(false);
		this.byId("bCancel").setEnabled(false);
		this.byId("bDelete").setEnabled(false);
		this.byId("bSave").setEnabled(false);
		
		// Clean form
		this.byId("zoneId").setValue("");
		this.byId("zoneId").setEnabled(true);
		this.byId("description").setValue("");
		this.byId("description").setEditable(false);
		
		if(this.ADMIN_ROLE){
			this.byId("bukrs").setSelectedKey(null);
			this.byId("werks").removeAllItems();
			this.byId("werks").setSelectedKey(null);
		}		
		this.byId("bukrs").setEnabled(false);
		
		this.byId("werks").setEnabled(false);
		this.byId("lgort").removeAllItems();
		this.byId("lgort").setSelectedKey(null);
		this.byId("lgort").setEnabled(false);
		
		this.byId("createdBy").setValue("");
		this.byId("modifiedBy").setValue("");
		
		// Enable Controls to add positions
		this.byId("bUpload").setEnabled(false);
		this.byId("bAddPosition").setEnabled(false);
		this.byId("bDeletePosition").setEnabled(false);	
		
		// Empty table
		this.getView().setModel(new JSONModel([]), "modelTable");
		
	},
	
	eraseNotification : function() {
		this.byId("vbFrame").setVisible(false);		
	},
	
	downloadTemplate: function(){
		
		let link = document.createElement("a");
	    link.href = InveTemplates.ZONE;
	    link.click();		
	},
			
	showModalZones: async function(){
		BusyIndicator.show(0);
		this.eraseNotification();	

		let oView = this.getView();
		if (!this.byId("oDialogZoneForZones")) {
				
			Fragment.load({
				id: oView.getId(),
				name: "com.bmore.inveweb.view.fragments.vMCZoneForZones",
				controller: this
			}).then(async function(oDialog){
				oView.addDependent(oDialog);	
				this.tableFrgModel = new JSONModel([]);
				this.cleanOdialogZoneForZonessFragment();
				await this.loadZones();
				oDialog.open();
			}.bind(this));
		}else{
			this.tableFrgModel = new JSONModel([]);
				this.cleanOdialogZoneForZonessFragment();
				await this.loadZones();
			this.byId("oDialogZoneForZones").open();
		}
			BusyIndicator.hide();
	},
	cleanOdialogZoneForZonessFragment: function(){
		
		let fSearchZone = this.frgById("fSearchZone");
		fSearchZone.setValue("");
		this.tableFrgModel.setProperty("/",[]);
	},
	_closeDialogZoneForZones:function(){
		this.byId("oDialogZoneForZones").close();
	},
	filterZones: function(oEvent){
		let sQuery = oEvent.getSource().getValue();
		let oFilter = new Filter({
		  filters: [
			new Filter("zoneIdAux", FilterOperator.Contains, sQuery),
			new Filter("zdesc", FilterOperator.Contains, sQuery)
		  ],
		  and: false
		});
		let oBinding =  this.frgById("frgTable").getBinding("items");
		oBinding.filter(oFilter, FilterType.Application);
	},
	loadZones: async function(){
		BusyIndicator.show(0);
		
		let bukrs = null;
		let werks = null;
				
		if(!this.ADMIN_ROLE){
			
			bukrs = this.getBukrs();
			werks = this.getWerks();
		}
		
		let search =  this.frgById("fSearchZone").getValue().trim();
		
		let zoneBean = new Object();
		zoneBean.zoneId = search; 
		zoneBean.zdesc = search;
		zoneBean.bukrs = bukrs
		zoneBean.werks =  werks;	
		
		let modelData = await this.getZoneOnly(zoneBean);
		this.tableFrgModel = new JSONModel();
		this.tableFrgModel.setProperty("/", modelData);
		
		this.frgById("frgTable").setModel(this.tableFrgModel, "tableFrgModel");
		BusyIndicator.hide();
	},
	getZoneOnly: async function (object) {

		const request = {
            tokenObject:null,
			lsObject:object
          };

		const json = await this.execService(InveServices.GET_ZONE_ONLY,request,"getZoneOnly",this.showLog);
		if(json){
			
				//Create a model and bind the table rows to this model
				
				for(let i in json.lsObject){
					json.lsObject[i].zoneIdAux = json.lsObject[i].zoneId.toString();
					json.lsObject[i].zoneId = parseInt(json.lsObject[i].zoneId);
				}
				
				//Create a model and bind the table rows to this model	            		
				return json.lsObject;  
		}
		
      },
	  getZones: function(zoneId){
		BusyIndicator.show(0);	
		let zoneBean = new Object();
		zoneBean.zoneId = zoneId;
		zoneBean.zdesc = null;
		zoneBean.bukrs = null;
		zoneBean.werks = null;
		zoneBean.lgort = null;
		zoneBean.BDesc = null;
		zoneBean.WDesc = null;
		zoneBean.GDesc = null;
		zoneBean.createdBy = null;
		zoneBean.modifiedBy = null;	
		zoneBean.positions = null;
		
		this.execGetZones(zoneBean);

	},
	selectZone: function(evt){
		let oTableZone = evt.getSource();
		let item = oTableZone.getSelectedItems();
		let cells = item[0].getCells();
		this.getZones(cells[0].getText());
		oTableZone.removeSelections(true);					
		this._closeDialogZoneForZones();
	}, 
	
	execGetZones: async function (object) {
		const request = {
            tokenObject:null,
			lsObject:object
          };
		const json = await this.execService(InveServices.GET_ZONES,request,"getZones",this.showLog);
		if(json){
			let row = json.lsObject[0];
				
				this.backupRecord = row;
				try {
					this.byId('zoneId').setValue(row.zoneId);
				} catch (e) {
					console.warn(e);
				}
				
				try {
					this.byId('description').setValue(row.zdesc);
					this.byId('description').setEditable(false);
				} catch (e) {
					console.warn(e);
				}
				
				try {						
					this.byId('bukrs').setSelectedKey(row.bukrs);
					this.byId('bukrs').setEnabled(false);			
				} catch (e) {
					console.warn(e);
				}
				
				try {
					
					this.byId('werks').removeAllItems();
					
					let item = new Item({
						text : row.werks + " - " + row.WDesc, // string
						key : row.werks, // string
						tooltip: row.werks
					});
					
					this.byId('werks').addItem(item);
					this.byId('werks').setSelectedKey(row.werks);			
					this.byId('werks').setEnabled(false);
				} catch (e) {
					console.warn(e);
				}
				
				try {
					
					this.byId('lgort').removeAllItems();
					
					let item = new Item({
						text : row.lgort + " - " + row.GDesc, // string
						key : row.lgort, // string
						tooltip: row.lgort
					});
					
					this.byId('lgort').addItem(item);
					this.byId('lgort').setSelectedKey(row.lgort);
					this.byId('lgort').setEnabled(false);
				} catch (e) {
					console.warn(e);
				}
				
				try {
					this.byId('createdBy').setValue(row.createdBy);
				} catch (e) {
					console.warn(e);
				}
				
				try {
					this.byId('modifiedBy').setValue(row.modifiedBy);
				} catch (e) {
					console.warn(e);
				}
				
				//Load table values
				try {
					
					let arr = this.copyObjToNew(row.positions) ;
					
					for(let i = 0; i < arr.length; i++){
						arr[i].editable = false;
						arr[i].secuency = arr[i].secuency.toString(); 
					}
						
					this.getView().setModel(new JSONModel(arr), "modelTable");
																	
				} catch (e) {
					console.warn(e);
				}
				
				//Enable buttons
				try {
					this.byId("bNew").setEnabled(true);
					this.byId("bEdit").setEnabled(true);
					this.byId("bCancel").setEnabled(false);
					this.byId("bSave").setEnabled(false);
					this.byId("bDelete").setEnabled(true);
					this.byId("bUpload").setEnabled(false);
					this.byId("bAddPosition").setEnabled(false);
					this.byId("bDeletePosition").setEnabled(false);
				} catch (e) {
					console.log(e)
				}
		}
		
      },
	  frgById:function(id){
		return Fragment.byId(this.getView().getId(), id);
	},
	loadSocieties: async function(){	
		let selectBukrs;
		const request = {
			tokenObject: null,
			lsObject:""
		};

		const json = await this.execService(InveServices.GET_BUKRS,request,"loadSocieties",this.showLog);
			if(json){
				selectBukrs = this.byId("bukrs");
				selectBukrs.removeAllItems();
				selectBukrs.destroyItems();	
				let data = json.lsObject;
				for(let i in data){
					
					let item = new Item({
								text : data[i].bukrs + " - " + data[i].bukrsDesc, // string
								key : data[i].bukrs, // string
								tooltip : data[i].bukrs, // sap.ui.core.TooltipBase
							});
					selectBukrs.addItem(item);	            			
				}
				//console.log("selectBukrs",selectBukrs);
			}
		return selectBukrs;

	},	
	
	loadWerks: async function(){
		let selectWerks;
		this.eraseNotification();
		
		let bukrsBean = new Object();
		bukrsBean.bukrs = this.byId('bukrs').getSelectedKey();
		bukrsBean.bukrsDesc = null;
		bukrsBean.werks = null;
		bukrsBean.werksDesc = null;

		const request = {
			tokenObject: null,
			lsObject: bukrsBean
		};

		const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);
			if(json){
				// Create a model and bind the table rows to this model
				selectWerks = this.byId("werks");
				selectWerks.removeAllItems();
				selectWerks.destroyItems();
				let data = json.lsObject;	            		
				
				for(let i in data){
					
					let item = new Item({
								text : data[i].werks + " - " + data[i].werksDesc, // string
								key : data[i].werks, // string
								tooltip : data[i].werks, // sap.ui.core.TooltipBase
							});
					selectWerks.addItem(item);	            			
				} 	
				
				setTimeout(function() {
					this.getView().byId("werks").focus();
				}.bind(this),100);
				
				this.byId("lgort").destroyItems();
				this.byId("lgort").removeAllItems();
				this.cleanTable();
			}

			return selectWerks;
		
	},
	
	loadLgort: async function(){
				
		this.eraseNotification();
				
		let LgortBeanView = new Object();
		LgortBeanView.werks = this.byId("werks").getSelectedKey();
		LgortBeanView.lgort = null;
		LgortBeanView.lgobe = null;
		LgortBeanView.lnumt = null;
		LgortBeanView.imwm = null;

		const request = {
			tokenObject: null,
			lsObject: LgortBeanView
		};

		const json = await this.execService(InveServices.GET_LGORT_AND_WERKS,request,"loadLgort",this.showLog);
			if(json){
				let select = this.byId("lgort");
				select.removeAllItems();
				select.destroyItems();
				let data = json.lsObject;	            		
				
				for(let i in data){
					
					let item = new Item({
								text : data[i].lgort + " - " + data[i].lgobe, // string
								key : data[i].lgort, // string
								tooltip : data[i].lgort, // sap.ui.core.TooltipBase
							});
					select.addItem(item);	            			
				}
				setTimeout(function() {
					this.getView().byId("lgort").focus();
				}.bind(this),100);
				this.cleanTable();
			}
	},
	
	setfocusOnAddPos: function(){
		
		setTimeout(function() {
		    this.getView().byId("bAddPosition").focus();
		}.bind(this),100);
		
		this.cleanTable();
	},
	
	cleanTable: function(){
		
		// Empty table
		this.getView().setModel(new JSONModel([]),"modelTable");
	},
		
	newRecord: function(){
		
		this.backupRecord = {};
		this.eraseNotification();		
		this.setOnEdit(true);
		
		// Set the state for main controls
		this.byId("bNew").setEnabled(false);
		this.byId("bEdit").setEnabled(false);
		this.byId("bCancel").setEnabled(true);
		this.byId("bDelete").setEnabled(false);
		this.byId("bSave").setEnabled(true);
		
		// Clean form
		this.byId("zoneId").setValue("");
		this.byId("zoneId").setEnabled(false);
		this.byId("description").setValue("");
		this.byId("description").setEditable(true);
		
		if(!this.ADMIN_ROLE){
			
			this.byId("bukrs").setEnabled(false);
		}else{
			
			this.byId("bukrs").setSelectedKey(null);		
			this.byId("bukrs").setEnabled(true);
		}		
		
		if(!this.ADMIN_ROLE){
						
			this.byId("werks").setEnabled(false);
		}else{
			
			this.byId("werks").removeAllItems();	
			this.byId("werks").setSelectedKey(null);
			this.byId("werks").setEnabled(true);
		}
		
		if(!this.ADMIN_ROLE){
			
			this.loadLgort();
		}else{
			this.byId("lgort").removeAllItems();
			this.byId("lgort").setSelectedKey(null);
		}
		
		setTimeout(function() {
			this.byId("description").focus();
		}.bind(this),100);
		
		this.byId("lgort").setEnabled(true);		
		this.byId("createdBy").setValue("");
		this.byId("modifiedBy").setValue("");
		
		// Enable Controls to add positions
		this.byId("bUpload").setEnabled(true);
		this.byId("bAddPosition").setEnabled(true);
		this.byId("bDeletePosition").setEnabled(true);
				
		// Empty table
		this.cleanTable();
	},
	
	editRecord: function(){
		
		this.eraseNotification();		
		this.setOnEdit(true);
		
		// Set the state for main controls
		this.byId("bNew").setEnabled(false);
		this.byId("bEdit").setEnabled(false);
		this.byId("bCancel").setEnabled(true);
		this.byId("bSave").setEnabled(true);
		this.byId("bDelete").setEnabled(false);
		
		this.byId("zoneId").setEnabled(false);
		this.byId("description").setEditable(true);				
		this.byId("bukrs").setEnabled(false);		
		this.byId("werks").setEnabled(false);
		this.byId("lgort").setEnabled(false);
		
		// Enable Controls to add positions
		this.byId("bUpload").setEnabled(true);
		this.byId("bAddPosition").setEnabled(true);
		this.byId("bDeletePosition").setEnabled(true);
				
		let data = [];
		
		try {
			data = this.getView().getModel("modelTable").getData();
		} catch (e) {
			data = [];
		}		
		
		for(let i in data){
			data[i].editable = true;
		}
					        			 
		this.getView().setModel(new JSONModel(data),"modelTable");
		this.getView().getModel("modelTable").refresh(true);
	},	
	
	cancelEdition: function(){
		
		this.eraseNotification();		
		
		MessageBox.confirm(
				 "¿Desea cancelar la edición?", {
			          icon: MessageBox.Icon.QUESTION,
			          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
			          onClose: function(oAction) { 
			        	  
			        	if(oAction == 'YES'){
			        		this.execCancel();			        					        					        					        					        		
			        	}  			        	  			        	  
			        }.bind(this)						
				}
			);
	},

	execCancel: function(){
		this.flag = false;
		this.setOnEdit(false);
									
		let zoneId = this.byId("zoneId").getValue();
		this.byId("bNew").setEnabled(true);
		
		if(zoneId.length == 0){
			this.byId("bEdit").setEnabled(false);
			this.byId("bDelete").setEnabled(false);
		}else{			        			
			this.byId("bEdit").setEnabled(true);
			this.byId("bDelete").setEnabled(true);
		}
									
		// Disable/Enable controls
		this.byId("bCancel").setEnabled(false);			        		
		this.byId("bSave").setEnabled(false);
																							
		this.byId("description").setValueState("None");
		this.byId("bukrs").setValueState("None");
		this.byId("werks").setValueState("None");
		this.byId("lgort").setValueState("None");
									
		// Disable Cotrols to add positions
		this.byId("bUpload").setEnabled(false);
		this.byId("bAddPosition").setEnabled(false);
		this.byId("bDeletePosition").setEnabled(false);
																								
		// Reset the values and disable inputs
		try {
			this.byId("description").setValue(this.backupRecord.zdesc);
		} catch (e) {
			this.byId("description").setValue("");
		}
		
		try {
			if(this.ADMIN_ROLE){
				this.byId("bukrs").setSelectedKey(this.backupRecord.bukrs);
				this.byId("werks").setSelectedKey(this.backupRecord.werks);
			}			        			
		} catch (e) {
			this.byId("bukrs").setSelectedKey(null);
			this.byId("werks").setSelectedKey(null);
		}
		
		try {
			this.byId("lgort").setSelectedKey(this.backupRecord.lgort);
		} catch (e) {
			this.byId("lgort").setSelectedKey(null);
		}
		
		this.byId("zoneId").setEnabled(true);
		this.byId("description").setEditable(false);
		this.byId("bukrs").setEnabled(false);
		this.byId("werks").setEnabled(false);
		this.byId("lgort").setEnabled(false);
		
		try {								
			// Restore table positions
			for(let i = 0; i < this.backupRecord.positions.length; i++){
				 this.backupRecord.positions[i].editable = false;
			}
			
			let positions = this.copyObjToNew(this.backupRecord.positions);
			this.getView().setModel(new JSONModel(positions),"modelTable");
			this.getView().getModel("modelTable").refresh(true);
		} catch (e) {
			console.warn(e);
		}
	},

	validationSave: function(i,modelData){
	
		let stop = false;
		for(let j = i + 1; j < modelData.length; j++){
				
			if(modelData[i].lgtyp == modelData[j].lgtyp 
					&& modelData[i].lgnum == modelData[j].lgnum
					&& modelData[i].lgtypDesc == modelData[j].lgtypDesc 
					&& modelData[i].lgpla == modelData[j].lgpla){
				
				BusyIndicator.hide();
									
				MessageBox.show('La combinación "Tipo Almacén" ' + modelData[i].lgtyp + ' y ' 
						+ '"Ubicación"\n '+ modelData[i].lgpla +' se encuentra ya definida.',
						MessageBox.Icon.ERROR, "Error");	    		
				stop = true;
				return stop;
			}
		}
		return stop;
	},

	saveEdition: async function(){
		
		let message;
		let value;

		value = this.byId("description").getValue();
		value = value.trim();
		if(value.length == 0){
			
			BusyIndicator.hide();
			
			message = 'Es necesario introducir la "Descripción".'; 
			this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pZone"));
			
    		return;
		}
		value = this.byId("bukrs").getSelectedKey();
		value = value.trim();
		if(value.length == 0){
			
			BusyIndicator.hide();
			
			message = 'Es necesario definir la "Sociedad".'; 
			this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pZone"));
			
    		return;
		}

		value = this.byId("werks").getSelectedKey();
		value = value.trim();
		if(value.length == 0){
			
			BusyIndicator.hide();
			
			message = 'Es necesario seleccionar un "Centro".'; 
			this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pZone"));
			
    		return;
		}
				
		value = this.byId("lgort").getSelectedKey();
		value = value.trim();
		
		
		if(value.length == 0){
			
			BusyIndicator.hide();
			
			message = 'Es necesario seleccionar un "Almacén".'; 
			this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pZone"));
			
    		return;
		}

		// Check data from table positions
		let modelData;
		
		try {
			modelData = this.getView().getModel("modelTable").getData();
		} catch (e) {
			modelData = [];
		}
		 
		let size = modelData.length;
		
		if(size == 0){
			
			BusyIndicator.hide();
			
			let message = 'Posiciones: Es necesario definir al menos una posición.'; 
			this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pZone"));	    		
			
    		return;
		}
		
		try {
			modelData = this.getView().getModel("modelTable").getData();
		} catch (e) {
			modelData = [];
		}
		//let size = modelData.length;		
		// Validate the sequence on zone positions
		for(let i = 0; i < size; i++){
			
			for(let j = i + 1; j < modelData.length; j++){
				
				if(modelData[i].lgtyp == modelData[j].lgtyp 
						&& modelData[i].lgnum == modelData[j].lgnum
						&& modelData[i].lgtypDesc == modelData[j].lgtypDesc 
						&& modelData[i].lgpla == modelData[j].lgpla){
					
					BusyIndicator.hide();
										
					MessageBox.show('La combinación "Tipo Almacén" ' + modelData[i].lgtyp + ' y ' 
							+ '"Ubicación"\n '+ modelData[i].lgpla +' se encuentra ya definida.',
							MessageBox.Icon.ERROR, "Error");	    		
					
					return 
				}
			}
						
			if(modelData[i].secuency == undefined ||
					modelData[i].secuency.length == 0){
				
				BusyIndicator.hide();
				
				message = 'Posiciones: Es necesario definir todas las secuencias'; 
				this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pZone"));	    		
				
	    		return;
			}
			
			let valueAux = parseInt(value);						
			
			if(isNaN(modelData[i].secuency) || valueAux == 0){
				
				BusyIndicator.hide();
				
				message = 'Posiciones: La secuencia "' + modelData[i].secuency + 
				'" no en una entrada válida.';
				this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pZone"));				
	    		
	    		return;
			}
									
			if(modelData[i].secuency > size){
				
				BusyIndicator.hide();
				
				this.message('Posiciones: La secuencia "'+ modelData[i].secuency + 
				'" excede el número de entradas definidas.', MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pZone"));	    		
				
	    		return;
			}			
			if(this.repeatPositions(i,modelData,size)){
				return;
			}
			
		}
		this.execSaveEdition();
	},

	repeatPositions: function(i,modelData,size){
		let stop = false;
		for(let j = i + 1; j < size; j++){								
				
			if(modelData[i].secuency == modelData[j].secuency){
				
				BusyIndicator.hide();
				
				this.message('Posiciones: La secuencia "'+ modelData[i].secuency + 
				'" se encuentra repetida.', MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pZone"));							    		
				
				stop = true;
			}
		}

		return stop;
	},
			
	execSaveEdition: async function(){
		
		this.eraseNotification();
		
		BusyIndicator.show(0);		
		
				
		let zoneBean = new Object();
		zoneBean.zoneId = this.byId("zoneId").getValue();		
		zoneBean.zdesc = this.byId("description").getValue();
		zoneBean.bukrs = this.byId("bukrs").getSelectedKey();
		zoneBean.BDesc = null;
		zoneBean.werks = this.byId("werks").getSelectedKey();
		zoneBean.WDesc = null;
		zoneBean.lgort = this.byId("lgort").getSelectedKey();
		zoneBean.GDesc = this.byId("lgort").getSelectedItem().getText();
		
		try {
			zoneBean.positions = this.getView().getModel("modelTable").getData();
		} catch (e) {
			zoneBean.positions = null;
		}
		
		const request = {
			tokenObject: null,
			lsObject: zoneBean
		};

		const json = await this.execService(InveServices.ADD_ZONE,request,"saveEdition",this.showLog);
			if(json){
				this.setOnEdit(false);
            		
            		this.flag = false;	            		
            		
            		// Disable form controls
					this.byId("zoneId").setEnabled(true);
            		this.byId("description").setEditable(false);
            		this.byId("bukrs").setEnabled(false);
            		this.byId("werks").setEnabled(false);		
            		this.byId("lgort").setEnabled(false);
            		
            		// Disable / enable the controls
            		this.byId("bNew").setEnabled(true);
            		this.byId("bEdit").setEnabled(true);
            		this.byId("bCancel").setEnabled(false);
            		this.byId("bSave").setEnabled(false);
            		this.byId("bDelete").setEnabled(true);
            		
            		// Disable controls on positions table
            		this.byId("bUpload").setEnabled(false);
            		this.byId("bAddPosition").setEnabled(false);
            		this.byId("bDeletePosition").setEnabled(false);
            			            					            			            		
            		// Refresh table with new data
            		this.backupRecord = json.lsObject;
            		this.byId("zoneId").setValue(this.backupRecord.zoneId);
            		this.byId("createdBy").setValue(this.backupRecord.createdBy);
            		this.byId("modifiedBy").setValue(this.backupRecord.modifiedBy);
            		let positions = this.copyObjToNew(json.lsObject.positions);	            		
            		
            		let size = positions.length;
            		for(let i = 0; i < size; i++){
            			positions[i].editable = false;
            			positions[i].secuency = positions[i].secuency.toString(); 
            		}
            						
					this.getView().setModel(new JSONModel(positions),"modelTable");
					this.getView().getModel("modelTable").refresh(true);
            			            		
            		let message = 'La zona se guardó de forma exitosa.'; 
            		this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pZone")); 
            	
					setTimeout(function() {
						this.byId("messagesBox").getItems()[0].close();  
					}.bind(this),3000);	
			}
	},	
			
	deleteRecord: function(){
		
		// Clear notifications
		this.eraseNotification();	
		MessageBox.confirm(
				 "¿Desea elimiar el registro?", {
			          icon: MessageBox.Icon.QUESTION,
			          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
			          onClose: function(oAction) { 			        	  
			        	if(oAction == 'YES'){
			        		
			        		this.deleteRemote(this.byId("zoneId").getValue());
			        				        					        					        		
			        	}  			        	  			        	  
			        }.bind(this)						
				}
			);
	},
	
	deleteRemote:async function(zoneId){
		
		const request = {
			tokenObject: null,
			lsObject: zoneId
		};

		const json = await this.execService(InveServices.DELETE_ZONE,request,"deleteZone",this.showLog);
		if(json){
			// Disable/Enable controls
			this.byId("bNew").setEnabled(true);
			this.byId("bEdit").setEnabled(false);
			this.byId("bCancel").setEnabled(false);			        		
			this.byId("bDelete").setEnabled(false);
			this.byId("bSave").setEnabled(false);
																
			this.byId("zoneId").setValueState("None");
			this.byId("description").setValueState("None");
			this.byId("bukrs").setValueState("None");
			this.byId("werks").setValueState("None");
			this.byId("lgort").setValueState("None");
								
			// Disable Cotrols to add positions
			this.byId("bUpload").setEnabled(false);
			this.byId("bAddPosition").setEnabled(false);
			this.byId("bDeletePosition").setEnabled(false);
																								
			// Reset the values and disable inputs
			this.byId("zoneId").setValue("");
			this.byId("zoneId").setEnabled(true);			        		
			this.byId("description").setValue("");
			this.byId("description").setEditable(false);
			if(this.ADMIN_ROLE){
				this.byId("bukrs").setSelectedKey(null);
			}	        		
			this.byId("bukrs").setEnabled(false);
			if(this.ADMIN_ROLE){
				this.byId("werks").setSelectedKey(null);
			}	        		
			this.byId("werks").setEnabled(false);
			this.byId("lgort").setSelectedKey(null);
			this.byId("lgort").setEnabled(false);
			this.byId("createdBy").setValue("");
			this.byId("modifiedBy").setValue("");
																							
			this.cleanTable();			        		
									
			let message = 'El registro fue eliminado de forma exitosa.'; 
			this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pZone"));       			
					
			setTimeout(function() {
				this.byId("messagesBox").getItems()[0].close();
			 }.bind(this),3000);
		}
		
	},
	
	exportData: function(){	
		let modelData;
		
		try {
			modelData = this.getView().getModel("modelTable").getData();
		} catch (e) {
			modelData = [];
		}
				
		if(modelData.length == 0){
			this.toast("Nada que exportar...", "20em");
			return;
		}
		let zoneId = this.byId("zoneId").getValue();
		let description = this.byId("description").getValue();
		let societyId = this.byId("bukrs").getSelectedKey();
		let society = this.byId("bukrs").getSelectedItem().getText();
		let centerId = this.byId("werks").getSelectedKey();
		let center = this.byId("werks").getSelectedItem().getText();
		let lgort = this.byId("lgort").getSelectedKey();
		let GDesc = this.byId("lgort").getSelectedItem().getText();
		let modelToExport = [];
		let row;
		let materials = "";
		
		for(let i = 0; i < modelData.length; i++){
			
			row = new Object();	
			if(i == 0){
				
				row.zoneId = zoneId;				
				row.description = description;
				row.bukrs = societyId;
				row.bukrsDesc = society;
				row.werks = centerId;
				row.werksDesc = center;
				row.lgort = lgort;
				row.GDesc = GDesc;				
			}	
			
			row.pkAsgId = modelData[i].pkAsgId;			
			row.lgtyp = modelData[i].lgtyp;
			row.lgtypd = modelData[i].lgtypDesc;
			row.lgpla = modelData[i].lgpla;
			row.imwm = modelData[i].imwm;
			row.secuency = modelData[i].secuency;			 			
			
			if(modelData[i].materials && modelData[i].materials.length > 0){
				
				for(let j = 0; j < modelData[i].materials.length; j++){
					
					materials = modelData[i].materials[j].matnr + " - " + 
					modelData[i].materials[j].descM;
					row.materials = materials
					modelToExport.push(JSON.parse(JSON.stringify(row)));	
					row.pkAsgId = "";			
					row.lgtyp = "";
					row.lgtypd = "";
					row.lgpla = "";
					row.imwm = "";
					row.secuency = "";
				}				
			}else{
				modelToExport.push(this.copyObjToNew(row));
			}		
			
		}
		
		let model = new JSONModel(modelToExport);		
		
		let oExport = new Export({

			exportType: new ExportTypeCSV({
				fileExtension: "csv",
				separatorChar: this.getCharSeparator()
			}),

			models: model,

			rows: {
				path: "/"
			},
			columns: [{
				name: "Id de Zona",
				template: {
					content: "{zoneId}"
				}
			}, {
				name: "Descripción",
				template: {
					content: "{description}"
				}
			}, {
				name: "Id de Sociedad",
				template: {
					content: "{bukrs}"
				}
			}, {
				name: "Sociedad",
				template: {
					content: "{bukrsDesc}"
				}
			}, {
				name: "Clave Centro",
				template: {
					content: "{werks}"
				}
			}, {
				name: "Centro",
				template: {
					content: "{werksDesc}"
				}
			}, {
				name: "Almacén",
				template: {
					content: "{lgort}"
				}
			}, {
				name: "Almacén Descripción",
				template: {
					content: "{GDesc}"
				}
			}, {
				name: "Typo de Almacén",
				template: {
					content: "{lgtyp}"
				}
			}, {
				name: "T. De A. Desc.",
				template: {
					content: "{lgtypd}"
				}
			}, {
				name: "Ubicación",
				template: {
					content: "{lgpla}"
				}
			}, {
				name: "IM /WM",
				template: {
					content: "{imwm}"
				}
			}, {
				name: "Sencuencia",
				template: {
					content: "{secuency}"
				}
			}, {
				name: "Materiales",
				template: {
					content: "{materials}"
				}
			},]
		});
		
		oExport.saveFile("Zona-"+zoneId).catch(function(oError) {
			console.error(oError);
		}).then(function() {
			oExport.destroy();
		}); 
		
	},
	
	openFilePicker: function(){
		
		$('#fileZone').click();		
	},
	
	uploadTemplate:	function(){			
		let that = this;
		let file = $('#fileZone').prop('files')[0];
		let allowedFiles=['csv'];
		let ext = file.name.split('.').pop().toLowerCase();
		
		// Check if is an allowed file
		if(allowedFiles.indexOf(ext) == -1){
			this.toast("Tipo de archivo no permitido, " +
					"solo se permiten archivos de tipo: " +  allowedFiles, '20em');
			$('#fileZone').val("");
			return;
		}
				
	    let reader = new FileReader();

	    // Read file into memory
	    reader.readAsText(file, 'ISO-8859-1');

	    // Handle errors load
	    reader.onload = loadHandler;
	    reader.onerror = errorHandler;

	    function loadHandler(event) {

	      let csv = event.target.result;
	      processData(csv);

	    }

	    function processData(csv) {
	    	
	        let allTextLines = csv.split(/\r\n|\n/);
	        let data;
	        let object;
	        let arrTable;
	        let lsMat;
	        let objMat;	        
	        let size = allTextLines.length;
	        
	        if(allTextLines[size - 1].indexOf(",") == -1){
	        	allTextLines.splice(-1);
	        }	        
	        
	        try {
	        	arrTable = that.getView().getModel("modelTable").getData();
			} catch (e) {
				arrTable = [];
			}
	        			
			for (let i = 1; i < allTextLines.length; i++) {
				
				data = allTextLines[i].split(',');
				
				if(data.length < 4){
					
					that.toast("Datos faltantes para la entrada: " + i, '20em');
					return;
				}				

	        	object = new Object();
	        	object.lgnum = data[0].trim();
	        	object.lgtyp = data[1].trim();	        	
	        	object.lgpla = data[2].trim();		        		        	
	        	object.secuency = data[3].trim(); 
	        	object.materials = [];
	        	
	        	try {
	        			        		
	        		lsMat = data[4].split(";").map(String);
	        		
	        		if(lsMat[0].length > 0){
	        			
	        			for(let j = 0; j < lsMat.length; j++){
		        			
		        			objMat = new Object();
		        			objMat.id = null;
		        			objMat.matnr = lsMat[j];
		        			objMat.descM = null
		        			object.materials.push(objMat);
		        		}	        			
	        		}
	        		
				} catch (e) {
					
					console.warn(e);
				}
	        	
	        	arrTable.push(object);	        			        			        
	        }
						
			
			that.getView().setModel(new JSONModel(arrTable),"modelTable");
			that.getView().getModel("modelTable").refresh(true);
			
			let message = 'Carga concluida con éxito.'; 
    		that.message(message, MessageType.Success,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pZone"));
				
			setTimeout(function() {
				that.byId("messagesBox").getItems()[0].close(); 
			 },5000);
				        	        	                
	    }

	    function errorHandler(evt) {

	    	if(evt.target.error.name == "NotReadableError") {       			
				MessageBox.show('No se puede leer el archivo.',					
						MessageBox.Icon.ERROR, "Error");
	    	}

	    }		
    	
		$('#fileZone').val("");
						
	},
	
	addPosition:async function(){
		
		let society = this.byId("bukrs").getSelectedKey();
		if(society.length == 0){
			        			
			MessageBox.show('Es necesario elegir la "Sociedad".',
					MessageBox.Icon.ERROR, "Error");
			
			return;
		}
		
		let center = this.byId("werks").getSelectedKey();
		center = center.trim();
		
		if(center.length == 0){
				        			
			MessageBox.show('Es necesario elegir el "Centro".',
					MessageBox.Icon.ERROR, "Error");
			
			return;
		}

		let lgort = this.byId("werks").getSelectedKey();
		lgort = lgort.trim();
		
		if(lgort.length == 0){
			        			
			MessageBox.show('Es necesario elegir el "Almacén".',
					MessageBox.Icon.ERROR, "Error");
			
			return;
		}
		
		let oView = this.getView();
		if (!this.byId("oDialogZonePositions")) {
				
			Fragment.load({
				id: oView.getId(),
				name: "com.bmore.inveweb.view.fragments.vMCZonePosition",
				controller: this
			}).then(async function(oDialog){
				oView.addDependent(oDialog);	
				this.catchEnterZonePosition();
				this.cleanOdialogZonePosition();
				await this.loadLgType();
				oDialog.open();
			}.bind(this));
		}else{
			this.catchEnterZonePosition();
			this.cleanOdialogZonePosition();
			await this.loadLgType();
			this.byId("oDialogZonePositions").open();
		}	
	},
	loadLgType: async function(){

		const tGortB = {
			bukrs : this.byId('bukrs').getSelectedKey(),
			werks : this.byId('werks').getSelectedKey(),
			lgort : this.byId('lgort').getSelectedKey()
		}

		const request = {
			tokenObject:null,
			lsObject:tGortB
		  };

		const json = await this.execService(InveServices.GET_TGORT,request,"loadLgType",this.showLog);
            if(json){
				let lgTyp = this.frgById("lgTyp");
				this.modelLgTyp = json.lsObject;
				
				for(let i = 0; i < json.lsObject.length; i++){
					
					let item = new Item({
						text : json.lsObject[i].lgTyp + " - " + json.lsObject[i].ltypt, // string
						key : json.lsObject[i].lgTyp, // string
						tooltip : json.lsObject[i].ltypt, // sap.ui.core.TooltipBase										
					});
					
					lgTyp.addItem(item);
				}            		
				  
				  BusyIndicator.hide(); 
			}
		
	}, 
	loadLgPla: async function(){
		BusyIndicator.show(0);
		setTimeout(function() {
		    this.frgById("lgPla").focus();
		 }.bind(this),500);
		
		 this.frgById("lgPla").destroyItems();
		
		let lgTyp = this.frgById("lgTyp");
		let item = this.frgById("lgTyp").getSelectedItem();
		let key = lgTyp.getSelectedKey();
		let index = lgTyp.indexOfItem(item);
		let data;
		try {
			data = this.modelLgTyp;
		} catch (e) {
			data = [];
		}
		
		if(data.length == 0){
        	
        	MessageBox.show('No existe un número de almacén asociado a este "Tipo de Almacén".',
					MessageBox.Icon.ERROR, "Error");
        	return;
		}
		let lagpEntity;
		try {
			lagpEntity = {
				lgNum : data[index].lgNum,
				lgTyp : key
			};
			
			this.lgNum = data[index].lgNum;
		} catch (error) {
			BusyIndicator.hide();
			return;
		}			
		
		
		const request = {
			tokenObject:null,
			lsObject:lagpEntity
		  };

		const json = await this.execService(InveServices.GET_LAGP,request,"loadLgType",this.showLog);
            if(json){
				let lgPla = this.frgById("lgPla");
            		this.modelLgPla = json.lsObject;
            		
            		for(let i = 0; i < json.lsObject.length; i++){
            			
            			let item = new Item({
							text : json.lsObject[i].lgPla, // string
							key : json.lsObject[i].lgPla, // string
							tooltip : json.lsObject[i].lgPla, // sap.ui.core.TooltipBase										
						});
            			
            			lgPla.addItem(item);
            		}	
					BusyIndicator.hide();      
			}		
	},
	setFocusZonePositions: function(){
		setTimeout(function() {
		    this.frgById("secuency").focus();
		 }.bind(this),500);
	},
	setValuesZonePositions: function(){
		
		let value;
		let lgTyp = this.frgById("lgTyp");
		value = lgTyp.getSelectedKey();
		if(value.length == 0){        			
			MessageBox.show('Es necesario elegir el "Tipo de Almacén".',
					MessageBox.Icon.ERROR, "Error");
			
			return;
		}
		
		let lgPla = this.frgById("lgPla");
		value = lgPla.getSelectedKey();
		if(value.length == 0){        			
			MessageBox.show('Es necesario elegir la "Ubicación".',
					MessageBox.Icon.ERROR, "Error");
			
			return;
		}
		
		let secuency = this.frgById("secuency");		
		value = secuency.getValue();
		if(value.length == 0){	        			
			MessageBox.show('Es necesario definir la "Secuencia".',
					MessageBox.Icon.ERROR, "Error");
			
			return;
		}else{
			
			let regexA = /^[0-9]*$/;
			let valueAux = parseInt(value)
			if(!value.match(regexA) || valueAux == 0){        			
				MessageBox.show('La secuencia "' + value + '" no en una entrada válida.',
						MessageBox.Icon.ERROR, "Error");	    		
	    		return;
			}
		}				
		
		let data;
		
		try {
			data = this.getView().getModel("modelTable").getData();
		} catch (e) {
			data = [];
		}
		
		let lgTypAux = lgTyp.getSelectedKey();
		let lgNumAux = this.lgNum;
		let ltyptAux = lgTyp.getSelectedItem().getText();
		let lgPlaAux = lgPla.getSelectedItem().getText();
		
		for(let i = 0; i < data.length; i++){
			if(data[i].lgtyp == lgTypAux 
					&& data[i].lgnum == lgNumAux
					//&& data[i].lgtypDesc == ltyptAux 
					&& data[i].lgpla == lgPlaAux){        			
				MessageBox.show('La combinación ya se encuentra definida.',
						MessageBox.Icon.ERROR, "Error");	    		
	    		return;
			}
		}
		
		lgPla = this.frgById("lgPla");
		let item = this.frgById("lgPla").getSelectedItem();
		let index = lgPla.indexOfItem(item);
		let selectLgpla = this.modelLgPla;		
		let entry = new Object();
		let imwm = selectLgpla[index].imwm;;

		entry.lgnum = this.lgNum;
		entry.lgtyp = lgTyp.getSelectedKey();
		entry.lgtypDesc = lgTyp.getSelectedItem().getText();
		entry.lgpla = lgPla.getSelectedKey();
		entry.imwm = imwm;
		entry.secuency = secuency.getValue();
		entry.editable = true;
		entry.materials = [];
		
		data.push(entry);		
		
		this.getView().setModel(new JSONModel(data),"modelTable");
		this.getView().getModel("modelTable").refresh(true);
	
		setTimeout(function() {
			this.byId("bAddPosition").focus();
		}.bind(this),100);		    	
		
		this._closeDialogZonePositions();
		
	},
	catchEnterZonePosition:function(){
		let input = this.frgById("secuency");
			
		input.attachBrowserEvent("keypress",function(evt){
			
			if (evt.keyCode == 13) {
				setTimeout(function() {
					this.byId("oDialogZonePositions").getEndButton().focus();
				 }.bind(this),100);
			}
		});
	},
	cleanOdialogZonePosition: function(){
						
		this.frgById("lgTyp").removeAllItems();		
		this.frgById("lgTyp").setSelectedKey(null);
		this.frgById("lgPla").removeAllItems();
		this.frgById("lgPla").setSelectedKey(null);
		this.frgById("secuency").setValue("");
	},
	_closeDialogZonePositions:function(){
		this.byId("oDialogZonePositions").close();
	},
	
	removePosition: function(){
		
		let oTable = this.byId('oTable');  		
        let selectedItems = oTable.getSelectedItems();
        
        if(selectedItems.length > 0){
        	
        	// Clean messages
    		this.getView().byId("messagesBox").removeAllItems();
        	
        	// Delete data
    		let selectedItems = oTable.getSelectedItems();

			let posicionesDeseadas = [];
			let modelData = this.getView().getModel("modelTable").getData();
			for(let i in oTable.getItems()){
				
				if(selectedItems.indexOf(oTable.getItems()[i]) == -1 ){
					posicionesDeseadas.push(modelData[i]);
				}			    			        			
			}	    			        			
    		
			this.getView().setModel(new JSONModel(posicionesDeseadas),"modelTable")	;
			this.getView().getModel("modelTable").refresh(true);
    		
        }else{
        	
        	this.toast("Nada que eliminar", "20em");
        }
	}, 	

	pressRowTable: function (oEvent) {

		let sPath = oEvent.getSource().oBindingContexts.modelTable.sPath;
		let oTable = this.byId("oTable");					
		this.row = oTable.getModel("modelTable").getObject(sPath);
	
		if(this.byId("lgort").getSelectedKey().length == 0){
			MessageBox.show('Es necesario definir el "Almacén".',					
					MessageBox.Icon.ERROR, "Error");
			return;
		}
		this.navTo("assignMaterial");
		
	},	

	});
  }
);
