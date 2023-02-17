sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageStrip",
	  "sap/m/MessageToast",
	  "sap/m/Dialog",
	  "sap/m/Button",
	  "sap/m/MessageBox",
      "sap/ui/unified/FileUploader",
      "sap/m/Label",
      "sap/m/StepInput",
      "sap/m/Select",
      "sap/m/TextArea",
      "sap/ui/core/Item",
      "sap/m/ButtonType",
	],
	function (Controller,BusyIndicator,JSONModel,MessageStrip,MessageToast,Dialog,Button,
                MessageBox,FileUploader,Label,StepInput,Select,TextArea,Item,ButtonType) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vJustifyLgpla", {

        onInit: function() {
            // Code to execute every time view is displayed
            this.getView().addDelegate({
                
                onBeforeShow : function(evt) {                 
                    BusyIndicator.hide();
                    this.controllerConsSap().lastJustifyActive ="Ubicación";
                    this.controllerConsSap().lastJustifyTab ="tabCByLgpla";
                    this.cleanView();
                    this.setData(this.controllerConsSap().rowJustify);
                }.bind(this)
            });
                
        },

        consSapById: function(id){
            return sap.ui.getCore().byId("container-inveweb---vConsSap--"+id);
         },
 
         controllerConsSap: function(){
 
             return sap.ui.getCore().byId('container-inveweb---vConsSap').getController();
         },
        
        cleanAll: function(){
            
            this.cleanView();		
            sap.ui.getCore().byId('container-inveweb---vConsSap').getController().cleanView();
        },
        
        cleanView: function(){
            
            this.byId("lgort").setText("");
		    this.byId("lgpla").setText("");
            this.byId("matnr").setText("");
            this.byId("description").setText("");
                    
            // Empty table
            this.byId("oTableJustifyLgpla").setModel(new JSONModel([]),"oModelJustifyLgpla");
        },
                
        returnAction : function() {
            
            let data;
            try {
                data = this.byId('oTableJustifyLgpla').getModel("oModelJustifyLgpla").getData();
            } catch (e) {
                data = [];
            }
                    
            this.row.lsJustification = data;
            
            let sumQuantityUMB = 0;
            
            //Get the quantity per justification
            for(let i = 0; i < data.length; i++){
                
                sumQuantityUMB += parseFloat(data[i].quantity.replace(/,/g,""));
            }	
            
            let quantity = sap.ui.getCore().byId('container-inveweb---vConsSap').getController().quantityLgpla;
//		console.log("lgpla quantity",quantity);
//		let money = sap.ui.getCore().byId('vConsSap').getController().money;
		let theoric;
		let counted;
		let oModel;
		let oTable = sap.ui.getCore().byId("container-inveweb---vConsSap--oTableByLgpla");
		
		for(let j = 0; j < quantity.length; j ++){
			
			if(quantity[j].lgpla != undefined){
				if(quantity[j].matnr == this.row.matnr && quantity[j].lgort == this.row.lgort 
						&& this.isEqualLgpla(quantity[j].lgpla,this.row.lgpla)){
				
					//Update the quantity model
					counted = quantity[j].countedTot.replace(/,/g,"");
					theoric = quantity[j].theoric.replace(/,/g,"");
					
					let cou = (sumQuantityUMB + parseFloat(counted) - parseFloat(theoric)).toFixed(3);
					
					quantity[j].diff = new Intl.NumberFormat("en-US", {minimumFractionDigits: '3'}).format(cou);
					quantity[j].diffAux = cou;
					
			
					if(cou == 0){
						quantity[j].isc = false;
					}else{
						quantity[j].isc = true;
					}
							
					break;		
				}
			}else{
				if(quantity[j].matnr == this.row.matnr && quantity[j].lgort == this.row.lgort){
				
					//Update the quantity model
					counted = quantity[j].countedTot.replace(/,/g,"");
					theoric = quantity[j].theoric.replace(/,/g,"");
					
					let cou = (sumQuantityUMB + parseFloat(counted) - parseFloat(theoric)).toFixed(3);
					
					quantity[j].diff = new Intl.NumberFormat("en-US", {minimumFractionDigits: '3'}).format(cou);
					quantity[j].diffAux = cou;
					
			
					if(cou == 0){
						quantity[j].isc = false;
					}else{
						quantity[j].isc = true;
					}
							
					break;		
				}
			}

		}
		oModel = new JSONModel(quantity);									
		
		oTable.setModel(oModel,"oModelLgpla");					
		this.controllerConsSap().flag = true;
		this.controllerConsSap().fromJustifyLgpla = true;
        window.history.go(-1);	
	},
	
	isEqualLgpla: function(cad1, cad2){
		
		if(cad1 == undefined && cad2 == undefined){
			return true;
		}else if(cad1 != undefined && cad2 == undefined){
			return false;
		}else if(cad1 == undefined && cad2 != undefined){
			return false;
		}else if (cad1 != undefined && cad2 != undefined){
			if(cad1.trim().localeCompare(cad2.trim())== 0){
				return true;
			}else{
				return false;
			}
		}
	},
	
	setData: function(row){

		console.log("row", row);
		BusyIndicator.hide();				
		this.row = row;		
		let state = this.consSapById("bSave").getEnabled();
		
		if(this.controllerConsSap().lockButtonJLgpla
				|| this.controllerConsSap().validateConciType()){
			this.byId("bAddJustify").setEnabled(false);
			this.byId("bDeleteJustify").setEnabled(false);
		}else{
			this.byId("bAddJustify").setEnabled(state);
			this.byId("bDeleteJustify").setEnabled(state);
		}
		
		let oTable = this.byId("oTableJustifyLgpla");			        			 
		let model = new JSONModel(this.row.lsJustification == undefined ? []: this.row.lsJustification);		
		oTable.setModel(model,"oModelJustifyLgpla");
		
		this.byId("matnr").setText(this.row.matnr);
		this.byId("description").setText(this.row.matnrD);
		this.byId("lgort").setText(this.row.lgort +" - "+this.row.lgortD);
		this.byId("lgpla").setText(this.row.lgpla);
	},
	
	selectRow: function(oEvent){
		
		let index = oEvent.getParameter("rowIndex");
		try {
			this.byId("oTable").setSelectedIndex(index);
		} catch (e) {
			console.log(e);
		}		
	},
	
	addJustify: function(){

		this.checkSession();
		if (!this.oDialogMCJustify) {
        	
			let laQuantity = new Label({
				text : "Cantidad U.M.B", // string
                width : "95%"
			});
			
			let quantity = new StepInput({				
				id: "quantityLgpla",
				displayValuePrecision: 3,
				step : 1, // float
				largerStep : 2, // float
				//value : 0, // float
				placeholder : "Cantidad U.M.B", // string, since 1.44.15
                width : "95%",
				fieldWidth : "100%", // CSSSize, since 1.54
				change : [ function(oEvent) {
					let control = oEvent.getSource();
				}, this ]
			});
            quantity.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");
						
			let laJustify = new Label({
				text : "Justificación", // string
                width : "95%",
			});
            laJustify.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"); 
			
			let select = new Select({
				selectedKey : null, // string, since 1.11
				tooltip : undefined, // TooltipBase
				width: "95%",
				forceSelection: false,
			});

            select.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"); 
			
			let lsJustifies = this.controllerConsSap().lsJustifies;
			
			for(let i = 0; i < lsJustifies.length; i ++){
				
				let item = new Item({
					text : lsJustifies[i].jsId + " - " + lsJustifies[i].justification, // string
					key : lsJustifies[i].jsId, // string
					tooltip : lsJustifies[i].jsId + " - " + lsJustifies[i].justification, // TooltipBase
				});
				
				select.addItem(item);
			}
			
			let laJustifyDesc = new Label({
				text : "Justificación", // string
                width : "95%",
			});

            laJustifyDesc.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"); 
			
			let jsDesc = new TextArea({
				width : "95%", // CSSSize
				placeholder : "Justificación", // string
				rows : 5, // int
				maxLength : 200,
				height : undefined, // CSSSize
				tooltip : undefined, // TooltipBase
			});

            jsDesc.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");
			
			let laFile = new Label({
				text : "Archivo", // string
                width : "95%",
			});
            laFile.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");  
						
			let file = new FileUploader({
				id: "fEvidenceLgpla",
				busy : false, // boolean
				visible : true, // boolean
				name : undefined, // string
				width : "95%", // CSSSize
				additionalData : undefined, // string
				sameFilenameAllowed : true, // boolean
				buttonText : undefined, // string
				fileType : ["pdf", "xml", "jpg", "jpeg", "png", "xlsx", "xls", "msg"], // string[]
				multiple : false, // boolean
				maximumFileSize : 3, // float
				mimeType : undefined, // string[]
				sendXHR : false, // boolean
				placeholder : "Archivo", // string
				useMultipart : true, // boolean
				maximumFilenameLength : undefined, // int, since 1.24.0
				icon : "sap-icon://attachment", // URI, since 1.26.0
				iconOnly: true,
				tooltip : "Seleccionar Archivo", // TooltipBase
				change : [ function(oEvent) {
					this.file = oEvent.getParameter("files")[0];
					//let control = oEvent.getSource();
				}, this ],
				uploadComplete : [ function(oEvent) {
					let control = oEvent.getSource();
				}, this ],
				typeMissmatch : [ function(oEvent) {
					this.toast('Solo se permiten archivos del siguiente tipo: "pdf", "xml", "jpg", "jpeg", "png", "xlsx", "xls", "msg", .', "20em");
				}, this ],
				fileSizeExceed : [ function(oEvent) {
					this.toast("Solo se permiten 3MB por archivo, se anula la selección.", "20em");
				}, this ],
				fileAllowed : [ function(oEvent) {
					let control = oEvent.getSource();
				}, this ],
				uploadProgress : [ function(oEvent) {
					let control = oEvent.getSource();
				}, this ], // since 1.24.0
				uploadAborted : [ function(oEvent) {
					let control = oEvent.getSource();
				}, this ], // since 1.24.0
				filenameLengthExceed : [ function(oEvent) {
					let control = oEvent.getSource();
				}, this ], // since 1.24.0
				uploadStart : [ function(oEvent) {
					let control = oEvent.getSource();
				}, this ]
			// since 1.30.0
			})
            file.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");
			
			this.oDialogMCJustify = new Dialog({
				title : "Justificar", // string
				contentWidth : "35%", // CSSSize, since 1.12.1
				content : [laQuantity, quantity, laJustify, select, laJustifyDesc, jsDesc, laFile, file], // Control
				beginButton: new Button({
					text: 'Cerrar',
					press: function () {						
						this.oDialogMCJustify.close();						
					}.bind(this),
					
				}),
				endButton: new Button({
					text: 'Aceptar',
					press: function () {
						let q = quantity.getValue();
						if(q == 0){
							
							MessageBox.show('Es necesario definir un dato numérico válido para el campo "Cantidad U.M.B.".',
									MessageBox.Icon.ERROR, "Error");
							
							return;
						}
						
						let jsId = select.getSelectedKey();
						
						if(jsId.length == 0){
							
							MessageBox.show('Es necesario definir la "Justificación".',
									MessageBox.Icon.ERROR, "Error");
							return;
						}
						
						let jsD = jsDesc.getValue(); 
						let selText = select.getSelectedItem().getText();
						
						this.addRecord(this.row.matnr, this.row.lgort, this.row.lgpla, q, jsId, selText, jsD, this.file);
						this.oDialogMCJustify.close();						
					}.bind(this),
					type: ButtonType.Emphasized
				})
			})
		}
		
		this.file = null;			
		this.oDialogMCJustify.getContent()[1].setValue(0);
		this.oDialogMCJustify.getContent()[3].setSelectedKey(null);
		this.oDialogMCJustify.getContent()[5].setValue("");
		this.oDialogMCJustify.getContent()[7].setValue("");
		this.oDialogMCJustify.open();	
	},
	
	getBase64: function (obj) {
		let reader = new FileReader();
		reader.readAsDataURL(obj.file);
		reader.onload = function () {
			obj.base64File = reader.result.split(',')[1];
			obj.file = null;
			obj.local = true;
		};
		reader.onerror = function (error) {
			console.error(error);
		};
	},
	
	addRecord: function(matnr, lgort, lgpla, quantity, jsId, justify, jsDesc, file){
		
		//console.log("quantity ", quantity,  "justify ", justify, "file ", file);
		
		let oTable = this.getView().byId('oTableJustifyLgpla'); 
		let data = [];
		
		try {
			data = oTable.getModel("oModelJustifyLgpla").getData();
		} catch (e) {
			let oModel = new JSONModel(data);			
    		oTable.setModel(oModel,"oModelJustifyLgpla");		
		}
		
		this.controllerConsSap().jsCount++; //Increase the Justification counter
				
		let obj = new Object();
		obj.matnr = matnr;
		obj.lgort = lgort;
//		obj.lgpla = (lgpla != null ? (lgpla == " "? "-" : lgpla):"-");
		obj.lgpla = lgpla
		obj.jsCount = this.controllerConsSap().jsCount;
		obj.quantity = new Intl.NumberFormat("en-US", {minimumFractionDigits: '3'}).format(quantity);
		obj.jsId = jsId;
		obj.justify = justify;
		obj.jsDescription = jsDesc;
		obj.fileName = (file!=null?file.name:"");		
		
		if(file != null){
			obj.file = this.file;
			this.getBase64(obj);			
		}		
		data.push(obj);
		
		oTable.getModel("oModelJustifyLgpla").refresh(true);
	},
	
	removeJustify: function(){
		
		let oTable = this.getView().byId('oTableJustifyLgpla');  		
        let selectedItems = oTable.getSelectedItems();
        let allItems = oTable.getItems();
        
        if(selectedItems.length > 0){
        	
        	//Empty backup record
    		this.backupRecord = {};
    					        		
    		//Delete data
			let arr = [];
    		let data = oTable.getModel("oModelJustifyLgpla").getData();
            for(let i in allItems){
                if(selectedItems.indexOf(allItems[i]) == -1){
                    arr.push(data[i]);
                }
            }

            oTable.setModel(new JSONModel(arr),"oModelJustifyLgpla");
    		
        }else{
        	this.toast("Nada que eliminar", "20em");
        }
	}, 
		
	downloadFile: async function(oEvent){
				
		let index = oEvent.getSource().getParent().getIndex();
		let fileName = this.byId("oTableJustifyLgpla").getModel("oModelJustifyLgpla").getData()[index].fileName;
		let ext = fileName.split('.').pop().toLowerCase();								
		let local = this.byId("oTableJustifyLgpla").getModel("oModelJustifyLgpla").getData()[index].local;
		let downloadedDecodedFile;
		
		if(local == undefined){
						
			let lsObject = [];
			lsObject.push(this.consSapById("docInvId").getValue());
			lsObject.push(this.byId("oTableJustifyLgpla").getModel("oModelJustifyLgpla").getData()[index].jsId.toString());
			lsObject.push(this.byId("oTableJustifyLgpla").getModel("oModelJustifyLgpla").getData()[index].fileName);					

			const request = {
				tokenObject: null,
				lsObject: lsObject
			};

			const json = await this.execService(InveServices.GET_JS_FILE_BASE_64,request,"downloadFile",this.showLog);
              
            if(json){
				downloadedDecodedFile = atob(json.lsObject);
	            this.downloadFileBase64(fileName, ext, downloadedDecodedFile);
				BusyIndicator.hide();
			}
					
		}else{
			
			downloadedDecodedFile = atob(this.byId("oTableJustifyLgpla").getModel("oModelJustifyLgpla").getData()[index].base64File);
			this.downloadFileBase64(fileName, ext, downloadedDecodedFile);
		}
		
	}, 
	
	downloadFileBase64: function(fileName, ext, decodedFile){
				
		let ab = new ArrayBuffer(decodedFile.length);
		let ia = new Uint8Array(ab);
		
		for (let i = 0; i < decodedFile.length; i++) {
			ia[i] = decodedFile.charCodeAt(i);				
		}
					     
		let blob;
		//ext = fileName.split('.').pop().toLowerCase();
		
		if(ext == 'pdf'){
			blob = new Blob([ia],{ type: 'application/pdf' });
		}else if(ext == 'xml'){
			blob = new Blob([ia],{ type: 'text/xml' });
		}else if(ext == 'jpg' || ext == 'jpeg'){
			blob = new Blob([ia],{ type: 'image/jpeg' });
		}else if(ext == 'png'){
			blob = new Blob([ia],{ type: 'image/png' });
		}else if(ext == 'xlsx'){
			blob = new Blob([ia],{ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
		}else if(ext == 'xls'){
			blob = new Blob([ia],{ type: 'application/vnd.ms-excel' });
		}else if(ext == 'msg'){
			blob = new Blob([ia],{ type: 'application/vnd.ms-outlook' });
		}
		
		let url = window.URL.createObjectURL(blob);
		let a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);						
		a.click();			
		document.body.removeChild(a);			
		window.URL.revokeObjectURL(url);
	},
	
	dismissJustifies: function(){
		this.cleanView();
		this.row.lsJustification = [];
	}
      })
    }
);