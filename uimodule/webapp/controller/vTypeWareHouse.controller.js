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
	
		return Controller.extend("com.bmore.inveweb.controller.vTypeWareHouse", {
		onInit: function() {
			// Code to execute every time view is displayed
			this.getView().addDelegate({
					
				onBeforeShow: function(evt) {    
					this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
					BusyIndicator.hide();

											
					this.cleanView();
					this.backupRecord = new Object();	
					this.backupRecord.lsLgPla = [];
					this.setBukrsAndWerks();
					
					setTimeout(function() {
						$("#vTypeWareHouse--lgTyp-inner").attr("readonly", "readonly");
					 },300);
				}.bind(this)
			});		
		},

		setBukrsAndWerks: async function(){
			await this.loadSocieties();
			if(!this.ADMIN_ROLE){
				let bukrs = this.getBukrs();
				this.byId("bukrs").setSelectedKey(bukrs);
				this.byId("bukrs").setEnabled(false);

				await this.loadWerks();
				let werks = this.byId("werks");
				if(werks.getItems().length > 0){
					let rolWerks = this.getWerks();
					this.byId("werks").setSelectedKey(rolWerks);
					
				}
			this.byId("werks").setEnabled(false);
			}
		},

		returnAction : function() {
			
			this.flag = false;
			window.history.go(-1);
			
		},
		
		cleanView: function(){
			//console.clear();
			this.eraseNotification();		
			
			// Set the state for main controls
			this.byId("bNew").setEnabled(true);
			this.byId("bEdit").setEnabled(false);
			this.byId("bCancel").setEnabled(false);
			this.byId("bDelete").setEnabled(false);
			this.byId("bSave").setEnabled(false);
			
			// Clean form
			this.byId("lgTyp").setValue("");
			this.byId("lgTyp").setEnabled(true);		
			this.byId("ltypt").setValue("");
			this.byId("ltypt").setEditable(false);
			
			if(this.ADMIN_ROLE){
				this.byId("bukrs").setSelectedKey(null);
				this.byId("werks").removeAllItems();
				this.byId("werks").setSelectedKey(null);
			}	
			
			this.byId("bukrs").setEnabled(false);
			this.byId("werks").setEnabled(false);
			this.byId("lgNum").setValue("");
			this.byId("lgort").removeAllItems();
			this.byId("lgort").setSelectedKey(null);
			this.byId("lgort").setEnabled(false);
			
			// Enable Controls to add positions
			this.byId("bUpload").setEnabled(false);
			this.byId("bAddPosition").setEnabled(false);
			this.byId("bDeletePosition").setEnabled(false);
			
			// Empty table
			let oModel = new JSONModel([]);
			
			let oTable = this.byId("oTable");
			oTable.setModel(oModel,"oModel");
			oTable.getModel("oModel").refresh(true);
		},
		
		eraseNotification : function() {
			this.byId("vbFrame").setVisible(false);	
		},
		
		newRecord: async function(){
			
			this.backupRecord = {};
			this.backupRecord.lsLgPla = [];
			this.eraseNotification();		
			this.setOnEdit(true);
			
			// Set the state for main controls
			this.byId("bNew").setEnabled(false);
			this.byId("bEdit").setEnabled(false);
			this.byId("bCancel").setEnabled(true);
			this.byId("bDelete").setEnabled(false);
			this.byId("bSave").setEnabled(true);
			
			// Clean form
			this.byId("lgTyp").setValue("");
			this.byId("lgTyp").setEnabled(false);
			this.byId("ltypt").setValue("");
			this.byId("ltypt").setEditable(true);
			
			if(!this.ADMIN_ROLE){
				this.byId("bukrs").setEnabled(false);
				this.byId("werks").setEnabled(false);
				this.byId("lgort").removeAllItems();
				this.byId("lgort").setSelectedKey(null);
				await this.loadLgort();
			}else{
				this.byId("bukrs").setSelectedKey(null);		
				this.byId("bukrs").setEnabled(true);

				this.byId("werks").removeAllItems();
				this.byId("werks").setSelectedKey(null);		
				this.byId("werks").setEnabled(true);

				this.byId("lgort").removeAllItems();
				this.byId("lgort").setSelectedKey(null);
			}	
			
			this.byId("lgNum").setValue("");
			this.byId("lgort").setEnabled(true);
			
			setTimeout(function() {
				
				this.byId("ltypt").focus();
			}.bind(this),1000);
			
			// Enable Controls to add positions
			this.byId("bUpload").setEnabled(true);
			this.byId("bAddPosition").setEnabled(true);
			this.byId("bDeletePosition").setEnabled(true);
					
			// Empty table
			let oModel = new JSONModel();
			
			let oTable = this.byId("oTable");
			oTable.setModel(oModel,"oModel");	
		},
		
		editRecord: function(){
			
			this.eraseNotification();		
			this.setOnEdit(true);
					
			// Enable disable controls menu
			this.byId("bNew").setEnabled(false);
			this.byId("bEdit").setEnabled(false);
			this.byId("bCancel").setEnabled(true);		
			this.byId("bSave").setEnabled(true);
			this.byId("bDelete").setEnabled(false);
			
			// Enable form controls
			this.byId("lgTyp").setEnabled(false);
			this.byId("ltypt").setEditable(true);
			this.byId("bukrs").setEnabled(false);
			this.byId("werks").setEnabled(false);
			this.byId("lgort").setEnabled(false);
			
			// Enable Controls to add positions
			this.byId("bUpload").setEnabled(true);
			this.byId("bAddPosition").setEnabled(true);
			this.byId("bDeletePosition").setEnabled(true);
			
			// Enable content for table positions
			let oTable = this.byId("oTable");	
			let modelData;
			
			try {
				modelData = oTable.getModel("oModel").getData();
			} catch (e) {
				modelData = [];
			}		
			
			for(let i in modelData){
				modelData[i].editable = true;
			}
											
			let model = new JSONModel(modelData);	
			oTable.setModel(model,"oModel");	
			
		},
		
		cancelEdition: function(){
			
			this.eraseNotification();		
			
			// Show confirm dialog
			MessageBox.confirm(
					"¿Desea cancelar la edición?", {
						icon: MessageBox.Icon.QUESTION,
						actions: [MessageBox.Action.YES, MessageBox.Action.NO],
						onClose: function(oAction) { 
							
							if(oAction == 'YES'){
								
								this.setOnEdit(false);
															
								let lgTyp = this.byId("lgTyp").getValue();
								this.byId("bNew").setEnabled(true);
								
								if(lgTyp.length == 0){
									this.byId("bEdit").setEnabled(false);
									this.byId("bDelete").setEnabled(false);
								}else{			        			
									this.byId("bEdit").setEnabled(true);
									this.byId("bDelete").setEnabled(true);
								}
															
								// Disable/Enable controls
								this.byId("bCancel").setEnabled(false);			        		
								this.byId("bSave").setEnabled(false);
																													
								this.byId("ltypt").setValueState("None");
								this.byId("bukrs").setValueState("None");
								this.byId("werks").setValueState("None");
								this.byId("lgort").setValueState("None");
								
								this.byId("lgTyp").setEnabled(true);
								setTimeout(function() {
									$("#vTypeWareHouse--lgTyp-inner").attr("readonly", "readonly");
								},500);
								
								// Disable Cotrols to add positions
								this.byId("bUpload").setEnabled(false);
								this.byId("bAddPosition").setEnabled(false);
								this.byId("bDeletePosition").setEnabled(false);
																														
								// Reset the values and disable inputs
								try {
									this.byId("ltypt").setValue(this.backupRecord.ltypt);
								} catch (e) {
									this.byId("ltypt").setValue("");
								}
																						
								try {
									if(this.ADMIN_ROLE){
										this.byId("bukrs").setSelectedKey(this.backupRecord.bukrs);
									}			        			
								} catch (e) {
									this.byId("bukrs").setSelectedKey(null);
								}
								
								try {
									if(this.ADMIN_ROLE){
										this.byId("werks").setSelectedKey(this.backupRecord.werks);
									}			        			
								} catch (e) {
									this.byId("werks").setSelectedKey(null);
								}
								
								try {
									this.byId("lgNum").setValue(this.backupRecord.lgnum);
								} catch (e) {
									this.byId("lgNum").setValue("");
								}
								
								try {
									this.byId("lgort").setSelectedKey(this.backupRecord.lgort);
								} catch (e) {
									this.byId("lgort").setSelectedKey(null);
								}
								
								this.byId("ltypt").setEditable(false);
								this.byId("bukrs").setEnabled(false);
								this.byId("werks").setEnabled(false);
								this.byId("lgort").setEnabled(false);
								
								// Restore table positions
								try {
									for(let i in this.backupRecord.lsLgPla){
										this.backupRecord.lsLgPla[i].editable = false;			        			 
									}
								} catch (e) {
									console.warn(e);
								}
															
								let oTable = this.byId("oTable");	
								let positions = JSON.parse(JSON.stringify(this.backupRecord.lsLgPla));
								let model = new JSONModel(positions);
								oTable.setModel(model,"oModel");		        					        					        					        					        		
							}  			        	  			        	  
						}.bind(this)						
					}
				);
		},
		
		saveEdition: async function(){
			
			this.eraseNotification();
			
			let value;
			value = this.byId("ltypt").getValue();
			value = value.trim();
			if(value.length == 0){
				
				let message = 'Es necesario introducir la "Descripción".'; 
				this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pTypeWareHouse"));
				
				return;
			}
			
			value = this.byId("bukrs").getSelectedKey();
			value = value.trim();
			if(value.length == 0){
				
				let message = 'Es necesario definir la "Sociedad".'; 
				this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pTypeWareHouse"));
				
				return;
			}
					
			value = this.byId("werks").getSelectedKey();
			value = value.trim();
			if(value.length == 0){
				
				let message = 'Es necesario seleccionar un "Centro".'; 
				this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pTypeWareHouse"));
				
				return;
			}
			
			value = this.byId("lgort").getSelectedKey();
			value = value.trim();
			if(value.length == 0){
				
				let message = 'Es necesario seleccionar un "Almacén".'; 
				this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pTypeWareHouse"));
				
				return;
			}
			
			let data;
			let oTable = this.byId("oTable");
			
			try {
				data =  oTable.getModel("oModel").getData();
			} catch (e) {
				data = [];
			}

			if(data.length == 0){
				
				let message = 'Es necesario agregar por lo menos un carril.'; 
				this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pTypeWareHouse"));
				
				return;
			}
			
			let lane;
			let laneAux;
			for(let i = 0; i < data.length; i++){
							
				lane = data[i].description;
				lane = lane.trim();
				
				if(lane.length == 0){
					
					let message = 'Es necesario definir el "Carril" de las entradas proporcionadas.'; 
					this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pTypeWareHouse"));
					
					return;
				}
				
				// Check if lane is repeated
				for(let j = i + 1; j < data.length; j++){
					
					laneAux = data[j].description;
					laneAux = laneAux.trim();
					
					if(lane == laneAux){
						
						let message = 'El carril "' + lane +'" se encuentra repetido.' ; 
						this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pTypeWareHouse"));
						
						return;
					}
					
				}
			}
					
			this.backupRecord.lgTyp = this.byId("lgTyp").getValue();
			this.backupRecord.ltypt = this.byId("ltypt").getValue();
			this.backupRecord.bukrs = this.byId("bukrs").getSelectedKey();
			this.backupRecord.werks = this.byId("werks").getSelectedKey();
			this.backupRecord.lgort = this.byId("lgort").getSelectedKey();		
			this.backupRecord.positions = data;
					
			let oModel = new JSONModel(data);
					
			oTable.setModel(oModel,"oModel");
			
			let lgort = this.byId("lgort");
			let item = lgort.getSelectedItem();
			let index = lgort.indexOfItem(item);
			let lgNum = this.backupRecord.lgnum == undefined ? this.dataLgort[index].lgNum: this.backupRecord.lgnum; 
			
			for(let i in data){
				data[i].lgNum = lgNum;
			}
			
			const lgTypIMBean = {
				lgTyp : this.backupRecord.lgTyp,
				ltypt :  this.backupRecord.ltypt,
				bukrs : this.backupRecord.bukrs,
				werks :  this.backupRecord.werks,
				lgort : this.backupRecord.lgort,
				lsLgPla : data,
				lgnum : lgNum
			}
			const request = {
				tokenObject: null,
				lsObject:lgTypIMBean
			};
			// save the record	
			const json = await this.execService(InveServices.SAVE_LGTYP_IM,request,"saveLgTypIM",this.showLog);
			if(json){
				this.setOnEdit(false);
						
				this.byId("bNew").setEnabled(true);
				this.byId("bEdit").setEnabled(true);
				this.byId("bCancel").setEnabled(false);
				this.byId("bSave").setEnabled(false);
				this.byId("bDelete").setEnabled(true);
				
				// Refresh table with new data
				this.backupRecord = json.lsObject;
				this.byId("lgTyp").setValue(this.backupRecord.lgTyp);
				this.byId("lgNum").setValue(this.backupRecord.lgnum);
				let positions = JSON.parse(JSON.stringify(json.lsObject.lsLgPla));
				
				this.byId("lgTyp").setEnabled(true);
				this.byId("ltypt").setEditable(false);
				this.byId("bukrs").setEnabled(false);
				this.byId("werks").setEnabled(false);
				this.byId("lgort").setEnabled(false);
				this.byId("bUpload").setEnabled(false);
				this.byId("bAddPosition").setEnabled(false);
				this.byId("bDeletePosition").setEnabled(false);
				
				let size = positions.length;
				for(let i = 0; i < size; i++){
					positions[i].editable = false;
				}
										
				let oModel = new JSONModel(positions);				
				this.byId("oTable").setModel(oModel,"oModel");
				this.byId("oTable").getModel("oModel").refresh(true);
																
				let message = 'El registro se guardó de forma exitosa.'; 
				this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pTypeWareHouse")); 
				
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
								
								this.deleteRemote(this.byId("lgTyp").getValue());
																												
							}  			        	  			        	  
						}.bind(this)						
					}
				);
		},
		
		deleteRemote: async function(lgTyp){
			const request = {
				tokenObject: null,
				lsObject:lgTyp
			};
			const json = await this.execService(InveServices.DELETE_LGTYPS_IM,request,"deleteLgTypsIM",this.showLog);
			if(json){
				// Disable/Enable controls
				this.byId("bNew").setEnabled(true);
				this.byId("bEdit").setEnabled(false);
				this.byId("bCancel").setEnabled(false);			        		
				this.byId("bDelete").setEnabled(false);
				this.byId("bSave").setEnabled(false);
																	
				this.byId("lgTyp").setValueState("None");
				this.byId("ltypt").setValueState("None");
				this.byId("bukrs").setValueState("None");
				this.byId("werks").setValueState("None");
				this.byId("lgort").setValueState("None");
				
				this.byId("lgTyp").setEnabled(true);
				setTimeout(function(){
					$("#vTypeWareHouse--lgTyp-inner").attr("readonly", "readonly");
				}, 500);			        		
				
				// Disable Cotrols to add positions
				this.byId("bUpload").setEnabled(false);
				this.byId("bAddPosition").setEnabled(false);
				this.byId("bDeletePosition").setEnabled(false);
																									
				// Reset the values and disable inputs
				this.byId("lgTyp").setValue("");			        		
				this.byId("ltypt").setValue("");
				this.byId("ltypt").setEditable(false);
				if(this.ADMIN_ROLE){
					this.byId("bukrs").setSelectedKey(null);
					this.byId("werks").setSelectedKey(null);
					this.byId("lgort").removeAllItems();
				}	        		
				this.byId("bukrs").setEnabled(false);	 
				this.byId("werks").setEnabled(false);
				this.byId("lgNum").setValue("");
				
				this.byId("lgort").setSelectedKey(null);        			        		
				this.byId("lgort").setEnabled(false);
																								
				let oTable = this.byId("oTable");			        			 
				let model = new JSONModel([]);
				oTable.setModel(model,"oModel");			        		
										
				let message = 'El registro fue eliminado de forma exitosa.'; 
				this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pTypeWareHouse"));       			
											
				setTimeout(function() {
					this.byId("messagesBox").getItems()[0].close();  
				}.bind(this),3000);
			}	
		},
		
		downloadTemplate: function(){
			
			let link = document.createElement("a");
			link.href = InveTemplates.LGTYP;
			link.click();
		},

		downloadXLSX: function () {
			let oTable = this.byId("oTable");		
			let modelData;
			
			try {
				modelData = oTable.getModel("oModel").getData();
			} catch (e) {
				modelData = [];
			}
					
			if(modelData.length == 0){
				this.toast("Nada que exportar...", "20em");
				return;
			}
					
			let lgTyp = this.byId("lgTyp").getValue();
			let ltypt = this.byId("ltypt").getValue();
			let societyId = this.byId("bukrs").getSelectedKey();
			let society = this.byId("bukrs").getSelectedItem().getText();
			let centerId = this.byId("werks").getSelectedKey();
			let center = this.byId("werks").getSelectedItem().getText();
			let lgNum = this.byId("lgNum").getValue();
			let lgort = this.byId("lgort").getSelectedKey();
			let GDesc = this.byId("lgort").getSelectedItem().getText();
			let modelToExport = [];
			let row;
			
			console.log(modelData.length)
			console.log(modelData)
			
			for(let i in modelData){
				
				row = new Object();	
				if(i == 0){
					
					row.lgTyp = lgTyp;				
					row.ltypt = ltypt;
					row.bukrs = societyId;
					row.bukrsDesc = society;
					row.werks = centerId;
					row.werksDesc = center;
					row.lgNum = lgNum;
					row.lgort = lgort;
					row.GDesc = GDesc;				
				}	
				
				row.description = modelData[i].description;
				row.status = modelData[i].status? "Sí" : "No";	
				modelToExport.push(row);
			}
			
			let model = modelToExport;
			let reformattedArray = model.map(function(obj){
			  obj["TIPO ALMACEN"] = obj["lgTyp"];
			  obj["DESCRIPCIÓN"] = obj["ltypt"];
			  obj["ID SOCIEDAD"] = obj["bukrs"];
			  obj["SOCIEDAD"] = obj["bukrsDesc"];
			  obj["ID CENTRO"] = obj["werks"];
			  obj["CENTRO"] = obj["werksDesc"];
			  obj["NUMERO ALMACEN"] = obj["lgNum"];
			  obj["ID ALMACEN"] = obj["lgort"];
			  obj["ALMACEN"] = obj["GDesc"];
			  obj["CARRILES"] = obj["description"];
			  obj["ACTIVO"] = obj["status"];
			  
			  delete obj["lgTyp"];
			  delete obj["ltypt"];
			  delete obj["bukrs"];
			  delete obj["bukrsDesc"];
			  delete obj["werks"];
			  delete obj["werksDesc"];
			  delete obj["lgNum"];
			  delete obj["lgort"];
			  delete obj["GDesc"];
			  delete obj["description"];
			  delete obj["status"];
			
			  return obj;
		   });
			let ws = XLSX.utils.json_to_sheet(reformattedArray);
			let wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, lgTyp);
			
			XLSX.writeFile(wb, "TipoAlmacen-"+lgTyp+".xlsx");
		  },
		
		openFilePicker: function(){
			let bukrsIn = this.byId("bukrs").getSelectedKey();
			let werksIn = this.byId("werks").getSelectedKey();
			let logrtn = this.byId("lgort").getSelectedKey();
			if(bukrsIn == undefined ||bukrsIn =="" || werksIn == undefined || werksIn =="" || logrtn == undefined ||logrtn ==""){
				MessageBox.show('Debe seleccionar sociedad, centro y almacén para poder cargar un archivo',					
							MessageBox.Icon.ERROR, "Datos de cabecera incompletos");
				return;
			}
			$('#fileTypeWareHouse').click();		
		},
		
		uploadTemplate:	function(){			
			let form = new FormData();	
			let that = this;
			let file = $('#fileTypeWareHouse').prop('files')[0];
			let allowedFiles=['csv'];
			let ext = file.name.split('.').pop().toLowerCase();
			
			// Check if is an allowed file
			if(allowedFiles.indexOf(ext) == -1){
				this.toast("Tipo de archivo no permitido, " +
						"solo se permiten archivos de tipo: " +  allowedFiles, '20em');
				$('#fileTypeWareHouse').val("");
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
				allTextLines.splice(-1);
				let data;
				let object;
				let arrTable;	        
				let size = allTextLines.length;
										
				try {
					arrTable = that.byId("oTable").getModel("oModel").getData();
				} catch (e) {
					arrTable = [];
				}
				
				for (let i = 1; i < allTextLines.length; i++) {

					data = allTextLines[i].split(',');
					
					if(data.length < 1){
						
						that.toast("Datos faltantes para la entrada: " + i, '20em');
						return;
					}
					
					if(data.length > 0){
						
						object = new Object();
						object.description = data[0].trim();		        	
						object.status = true;
						arrTable.push(object);
					}		        	
				}
				
				let oModel = new JSONModel(arrTable);
				
				let oTable = that.byId("oTable");
				oTable.setModel(oModel,"oModel");			
				
				let message = 'Carga concluida con éxito.'; 
				that.message(message, MessageType.Success,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pTypeWareHouse"));
				
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
			
			$('#fileTypeWareHouse').val("");
							
		},
		
		loadSocieties: async function(){
			const request = {
				tokenObject: null,
				lsObject:""
			};
			const json = await this.execService(InveServices.GET_BUKRS,request,"getBukrs",this.showLog);
			if(json){
				// Create a model and bind the table rows to this model
				let lsSocieties = json.lsObject;
				this.lsSocieties = JSON.parse(JSON.stringify(json.lsObject)) ;
				
				let societySelect = this.byId("bukrs");
				societySelect.removeAllItems();
				societySelect.destroyItems();
				
				for(let i =0; i< lsSocieties.length; i++){
					
					let item = new Item({
						text : lsSocieties[i].bukrs + " - " +lsSocieties[i].bukrsDesc, // string
						key : lsSocieties[i].bukrs, // string
						tooltip : lsSocieties[i].bukrs, // sap.ui.core.TooltipBase
					});
					
					societySelect.addItem(item);
				}
				
				this.byId("werks").destroyItems();
				this.byId("werks").removeAllItems();
				this.byId("lgNum").setValue("");
				this.byId("lgort").destroyItems();
				this.byId("lgort").removeAllItems();
				this.cleanTable();
			}	
		},
		
		loadWerks: async function(){
			
			this.eraseNotification();
			
			let bukrsBean = new Object();
			bukrsBean.bukrs = this.byId("bukrs").getSelectedKey();
			bukrsBean.bukrsDesc = null;
			bukrsBean.werks = null;
			bukrsBean.werksDesc = null;
			const request = {
				tokenObject: null,
				lsObject:bukrsBean
			};

			const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);
			if(json){
				let lsCenters = json.lsObject;
						
					this.byId("werks").removeAllItems();
					this.byId("werks").destroyItems();
					
					for(let i in lsCenters){
						
						let item = new Item({
							text : lsCenters[i].werks + " - " + lsCenters[i].werksDesc, // string
							key : lsCenters[i].werks, // string
							tooltip : lsCenters[i].werks, // sap.ui.core.TooltipBase
						});
						
						this.byId("werks").addItem(item);
					}
					console.log("[loadWerks] items",this.byId("werks").getItems().length,new Date());
					setTimeout(function() {
						this.getView().byId("werks").focus();
					}.bind(this),100);
					
					this.byId("lgNum").setValue("");
					this.byId("lgort").destroyItems();
					this.byId("lgort").removeAllItems();
					this.cleanTable();
			}
		},
		
		loadLgort: async function(){
			this.eraseNotification();
							
			let LgortBeanView = new Object();
			LgortBeanView.werks = this.byId("werks").getSelectedKey();
			LgortBeanView.lgort = null;
			LgortBeanView.lgobe = null;
			LgortBeanView.lnumt = null;
			LgortBeanView.imwm = null;
			LgortBeanView.lgNum = null;

			const request = {
				tokenObject: null,
				lsObject:LgortBeanView
			};

			const json = await this.execService(InveServices.GET_NGORTS_IM,request,"loadLgort",this.showLog);
			if(json){
				let selectLgort = this.byId("lgort");
					selectLgort.removeAllItems();
					selectLgort.destroyItems();
					
					this.dataLgort = json.lsObject;
											
					for(let i = 0; i < json.lsObject.length; i++){
						
						let item = new Item({
									text : json.lsObject[i].lgort + " - " + json.lsObject[i].lgobe, // string
									key : json.lsObject[i].lgort, // string
									tooltip : json.lsObject[i].lgort, // sap.ui.core.TooltipBase
								});
						selectLgort.addItem(item);	            			
					}
					
					setTimeout(function() {
						this.getView().byId("lgort").focus();
					}.bind(this),100);
					
					this.byId("lgNum").setValue("");
					this.cleanTable();
			}

		},
		
		setLgNum: function(){
			
			let lgort = this.byId("lgort");
			let item = lgort.getSelectedItem();
			let index = lgort.indexOfItem(item);			
			let lgNum = this.backupRecord.lgnum == undefined ? this.dataLgort[index].lgNum: this.backupRecord.lgnum;
			
			this.byId("lgNum").setValue(lgNum);
			
			// Empty table
			this.cleanTable();	
			
			setTimeout(function() {
				this.getView().byId("bAddPosition").focus();
			}.bind(this),100);
		},
		
		cleanTable: function(){
			
			// Empty table
			let oModel = new JSONModel([]);
			
			let oTable = this.byId("oTable");
			oTable.setModel(oModel,"oModel");
		}, 
		
		addPosition: function(){
			
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
			
			let data;
			let oTable = this.byId("oTable");		
			let entry = new Object();
			try {
				data =  oTable.getModel("oModel").getData();
			} catch (e) {
				console.error(e);
				data = [];
			}
			
			entry.description = "";
			entry.status = true;
			data.push(entry);
					
			let oModel = new JSONModel(data);
			
			oTable.setModel(oModel,"oModel");
			if(oTable.getItems().length < 100){
				oTable.setGrowingThreshold(100);
			}else{
				oTable.setGrowingThreshold(oTable.getItems().length-1);
			}
			
			let size = oTable.getItems().length;
			
			oTable.getItems()[size-1].getCells()[0].focus();
					
		}, 
		
		removePosition: function(){
			
			let oTable = this.getView().byId('oTable');  		
			let selectedItems = oTable.getSelectedItems();
			
			if(selectedItems.length > 0){
				
				// Clean messages
				this.getView().byId("messagesBox").removeAllItems();	
				
				// Delete data
				let arr = [];
				let selectedItems = oTable.getSelectedItems();
				let data = oTable.getModel("oModel").getData();
				
				for(let i in oTable.getItems()){
					if(selectedItems.indexOf(oTable.getItems()[i]) == -1 ){
						arr.push(data[i]);
					}			    			        			
				}
				
				let oModel = new JSONModel(arr);		
				oTable.setModel(oModel,"oModel");	
				
			}else{
				
				this.toast("Nada que eliminar", "20em");
			}
		},
		
		showModalLgTyp: function(){	
			let oView = this.getView();
            if (!this.byId("oDialogTypeWarehouse")) {
    
                Fragment.load({
                    id: oView.getId(),
                    name: "com.bmore.inveweb.view.fragments.vMCLgTyp",
                    controller: this
                  }).then(function(oDialog){
                    oView.addDependent(oDialog);	
                    this.loadBukrsFragment();
					this.loadLogicFragment();
                    oDialog.open();
                  }.bind(this));
            }else{
                this.loadBukrsFragment();
				this.loadLogicFragment();
                this.byId("oDialogTypeWarehouse").open();
            }		
			
		},
		_closeDialogTypeWareHouse:function(){
            this.byId("oDialogTypeWarehouse").close();
        },
		loadBukrsFragment: function(){
			let societySelect = this.frgById("bukrsFrg");
			societySelect.removeAllItems();
			societySelect.destroyItems();
			for(let i =0; i< this.lsSocieties.length; i++){
				
				let item = new Item({
					text : this.lsSocieties[i].bukrs + " - " + this.lsSocieties[i].bukrsDesc, // string
					key : this.lsSocieties[i].bukrs, // string
					tooltip : this.lsSocieties[i].bukrs, // sap.ui.core.TooltipBase
				});
				
				societySelect.addItem(item);
			}	
		},
		loadLogicFragment:function(){
			if(!this.ADMIN_ROLE){
				
				let bukrsKey =  this.byId('bukrs').getSelectedKey();
				let bukrs = this.frgById("bukrsFrg");
				bukrs.setSelectedKey(bukrsKey);
				bukrs.setEnabled(false);
							
				let werksCombo = this.frgById("werksFrg");
				werksCombo.removeAllItems();
				werksCombo.destroyItems();
				
				if(werksCombo.getItems().length == 0){
					
					const iWerks = this.byId('werks').getSelectedItem();
								
					werksCombo.addItem(new Item({
						text : iWerks.getText(),
						key : iWerks.getKey()
					}));
					werksCombo.setSelectedKey(iWerks.getKey());
					werksCombo.setEnabled(false);
				}
										
				this.loadLgortFragment();
				
			}else{

				this.frgById("bukrsFrg").setEnabled(true);
				this.frgById("werksFrg").setEnabled(true);
				
				setTimeout(function() {
					this.frgById("bukrsFrg").focus();
				}.bind(this),50);
			}
			
			this.frgById("pFilter").setExpanded(true);
			this.frgById("pTable").setExpanded(false);
		},
		loadLgortFragment: async function(){
			
			let werksVal = this.frgById("werksFrg").getValue().trim();
			if(werksVal.length == 0){
				return;
			}

			let LgortBeanView = new Object();
			LgortBeanView.werks = this.frgById("werksFrg").getSelectedKey();
			LgortBeanView.lgort = null;
			LgortBeanView.lgobe = null;
			LgortBeanView.lnumt = null;
			LgortBeanView.imwm = null;
			LgortBeanView.lgNum = null;

			const request = {
				tokenObject: null,
				lsObject:LgortBeanView
			};

			const json = await this.execService(InveServices.GET_LGORT_AND_WERKS,request,"loadLgort",this.showLog);
			if(json){
				this.frgById("lgortFrg").setSelectedKey(null);
				setTimeout(function() {
					this.frgById("lgortFrg").focus();
					}.bind(this),300);
					
					let selectLgort = this.frgById("lgortFrg");
					selectLgort.removeAllItems();
					selectLgort.destroyItems();	
					
					this.dataLgort = json.lsObject;
					
					for(let i in json.lsObject){
						
						let item = new Item({
									text : json.lsObject[i].lgort + " - " +json.lsObject[i].lgobe, // string
									key : json.lsObject[i].lgort, // string
									tooltip : json.lsObject[i].lgort, // TooltipBase										
								});
						selectLgort.addItem(item);	            			
					}
					
					//Empty table
					this.cleanTableFragment();	
			}
		},
		cleanTableFragment: function(){
			
			//Empty table
			let oModel = new JSONModel([]);
			
			let oTable =  this.frgById("oTableLgTyp");
			oTable.setModel(oModel,"oModel");
		},
		loadWerksFragment: async function(){
			
			let bukrsVal = this.frgById("bukrsFrg").getValue().trim();
			if(bukrsVal.length == 0){
				return;
			}
					
			let bukrsBean = new Object();
			bukrsBean.bukrs = this.frgById("bukrsFrg").getSelectedKey();
			bukrsBean.bukrsDesc = null;
			bukrsBean.werks = null;
			bukrsBean.werksDesc = null;

			const request = {
				tokenObject: null,
				lsObject:bukrsBean
			};

			const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);
			if(json){
				setTimeout(function() {
					this.frgById("werksFrg").focus();
				}.bind(this),300);
				
				let lsCenters = json.lsObject;
				
				let werksSelect = this.frgById("werksFrg");
				werksSelect.removeAllItems();
				werksSelect.destroyItems();
				werksSelect.setValue("");
				
				for(let i in lsCenters){
					
					let item = new Item({
						text : lsCenters[i].werks + " - " + lsCenters[i].werksDesc, // string
						key : lsCenters[i].werks, // string
						tooltip : lsCenters[i].werks, // TooltipBase										
					});
					
					werksSelect.addItem(item);
				}
				
				this.frgById("lgortFrg").destroyItems();
				this.frgById("lgortFrg").removeAllItems();
				this.frgById("lgortFrg").setValue("");
				this.cleanTableFragment();
			}
		},
		getLgTypOnly: async function(){	
			let oModel = new JSONModel([]);			
			let oTableLgTyp = this.frgById("oTableLgTyp");	
			oTableLgTyp.setModel(oModel,"oModel");
			
			let search = this.frgById("fSearchLgtyp").getValue();
			
			let lgTypIMBean = new Object();
			lgTypIMBean.lgTyp = search; //The hold type
			lgTypIMBean.ltypt = search; //The hold description
			lgTypIMBean.bukrs = this.frgById("bukrsFrg").getSelectedKey(); //The society Id
			//lgTypIMBean.BDesc; //The society description
			lgTypIMBean.werks = this.frgById("werksFrg").getSelectedKey(); //The werks Id	
			//lgTypIMBean.WDesc; //The werks description
			lgTypIMBean.lgort = this.frgById("lgortFrg").getSelectedKey(); //The warehouse Id
			//lgTypIMBean.GDesc; //The warehouse description
			//lgTypIMBean.lgnum; //The lgnum
			//lgTypIMBean.imwm; //Indicates if is IM OR WM
			//lgTypIMBean.status;
			//lgTypIMBean.lsLgPla; //The location positions	

			const request = {
				tokenObject: null,
				lsObject:lgTypIMBean
			};

			const json = await this.execService(InveServices.GET_LGTYPS_ONLY,request,"getLgTypOnly",this.showLog);
			if(json){
				if(json.lsObject.length > 0){
					this.frgById("pFilter").setExpanded(false);
					this.frgById("pTable").setExpanded(true);
				}
				
				//Create a model and bind the table rows to this model
				oModel = new JSONModel(json.lsObject);         		            		
				oTableLgTyp.setModel(oModel,"oModel");
			}	
		},
		select: function(oEvent){
			
			let oTableLgTyp = this.frgById("oTableLgTyp");

			let items = oTableLgTyp.getSelectedItems();
			let cells = items[0].getCells();
			this.loadData(cells[0].getText());
		},
		loadData: async function(lgTyp){							
			let lgTypIMBean = new Object();
			lgTypIMBean.lgTyp = lgTyp; //The hold type
			lgTypIMBean.ltypt = null; //The hold description
			lgTypIMBean.bukrs = this.frgById("bukrsFrg").getSelectedKey(); //The society Id
			//lgTypIMBean.BDesc; //The society description
			lgTypIMBean.werks = this.frgById("werksFrg").getSelectedKey(); //The werks Id	
			//lgTypIMBean.WDesc; //The werks description
			lgTypIMBean.lgort = this.frgById("lgortFrg").getSelectedKey(); //The warehouse Id
			//lgTypIMBean.GDesc; //The warehouse description
			//lgTypIMBean.lgnum; //The lgnum
			//lgTypIMBean.imwm; //Indicates if is IM OR WM
			//lgTypIMBean.status;
			//lgTypIMBean.lsLgPla; //The location positions

			const request = {
				tokenObject: null,
				lsObject:lgTypIMBean
			};

			const json = await this.execService(InveServices.GET_LGTYPS_IM,request,"getLgTypsIM",this.showLog);
			if(json){
				
						
						let row = json.lsObject[0]; 
						
						this.backupRecord = row;
						
						try {
							this.byId('lgTyp').setValue(row.lgTyp);
						} catch (e) {
							console.warn(e);
						}
										
						try {			
							this.byId('ltypt').setValue(row.ltypt);
							this.byId('ltypt').setEditable(false);
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
								text : row.werks + " - " +row.WDesc, // string
								key : row.werks // string
							});
							
							this.byId('werks').addItem(item);
							this.byId('werks').setSelectedKey(row.werks);
							this.byId('werks').setEnabled(false);			
						} catch (e) {
							console.warn(e);
						}
								
						try {
							this.byId('lgNum').setValue(row.lgnum)
						} catch (e) {
							console.warn(e);
						}
						
						try {
							
							this.byId('lgort').removeAllItems();
							
							let item = new Item({
								text : row.lgort + " - " + row.GDesc, // string
								key : row.lgort // string
							});
							
							this.byId('lgort').addItem(item);
							this.byId('lgort').setSelectedKey(row.lgort);
							this.byId('lgort').setEnabled(false);
						} catch (e) {
							console.warn(e);
						}
								
						//Load table values
						try {
							
							//console.log(row)
							
							let arrAux = this.copyObjToNew(row.lsLgPla) ;
							
							//Add disable property to table model
							for(let i in arrAux){
								
								arrAux[i].editable = false;	            			
							}
							
							
							
							let oTable = this.byId("oTable");
							if(arrAux.length < 100){
								oTable.setGrowingThreshold(100);
							}else{
								oTable.setGrowingThreshold(arrAux.length-1);
							}
							
							let oModel = new JSONModel(arrAux);
							oTable.setModel(oModel,"oModel");
																						
						} catch (e) {
							console.warn(e);
						}
							
						//Enable / Disable controls on view
						try {
							this.byId("bNew").setEnabled(true);
							
							if(row.imwm == 'IM'){
								if(!row.status){
									this.byId("bEdit").setEnabled(true);
								}            				
							}else{
								this.byId("bEdit").setEnabled(false);
							}
							
							this.byId("bCancel").setEnabled(false);
							this.byId("bSave").setEnabled(false);
							
							if(row.imwm == 'IM'){
								if(!row.status){
									this.byId("bDelete").setEnabled(true);
								}            				
							}else{
								this.byId("bDelete").setEnabled(false);
							}
										
							this.byId("bAddPosition").setEnabled(false);
							this.byId("bDeletePosition").setEnabled(false);
										
						} catch (e) {
							console.warn(e);
						}
						
						this._closeDialogTypeWareHouse();
						this.cleanOdialog();
			}

		},
		cleanOdialog: function(){
			
			this.frgById("pFilter").setExpanded(false);
			this.frgById("bukrsFrg").setSelectedKey(null);
			this.frgById("werksFrg").removeAllItems();
			this.frgById("werksFrg").setSelectedKey(null);
			this.frgById("lgortFrg").removeAllItems();
			this.frgById("lgortFrg").setSelectedKey(null);		
			this.frgById("fSearchLgtyp").setValue("");
			
			let oModel = new JSONModel([]);		 	
			let oTableLgTyp = this.frgById("oTableLgTyp");	
			oTableLgTyp.setModel(oModel,"oModel");
		},	
		frgById:function(id){
            return Fragment.byId(this.getView().getId(), id);
        },
	});
  }
);
