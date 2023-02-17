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
  
	  return Controller.extend("com.bmore.inveweb.controller.vJustify", {

        onInit: function() {
            // Code to execute every time view is displayed
            this.getView().addDelegate({
                
                onBeforeShow : function(evt) {
                                        
                    BusyIndicator.hide();
                    sap.ui.getCore().byId('container-inveweb---vConsSap').getController().lastJustifyActive ="Centro";
                    sap.ui.getCore().byId('container-inveweb---vConsSap').getController().lastJustifyTab ="tabC";
                    this.cleanView();
                    this.setData(sap.ui.getCore().byId('container-inveweb---vConsSap').getController().rowJustify);
                }.bind(this)
            });
                
        },
        
        cleanAll: function(){
            
            this.cleanView();		
            sap.ui.getCore().byId('container-inveweb---vConsSap').getController().cleanView();
        },
        
        cleanView: function(){
            
            this.byId("matnr").setText("");
            this.byId("description").setText("");
                    
            // Empty table
            this.byId("oTableJustify").setModel(new JSONModel([]),"oModelJustify");
        },
                
        returnAction : function() {
            
            let data;
            try {
                data = this.byId('oTableJustify').getModel("oModelJustify").getData();
            } catch (e) {
                data = [];
            }
                    
            this.row.lsJustification = data;
            
            let sumQuantityUMB = 0;
            
            //Get the quantity per justification
            for(let i = 0; i < data.length; i++){
                
                sumQuantityUMB += parseFloat(data[i].quantity.replace(/,/g,""));
            }	
                    
            let flgViewType = sap.ui.getCore().byId('container-inveweb---vConsSap--tbSH').getPressed();
            let quantity = sap.ui.getCore().byId('container-inveweb---vConsSap').getController().quantity;
            let money = sap.ui.getCore().byId('container-inveweb---vConsSap').getController().money;
            let accountant;
            let counted;
            let oModel;
            let oTable = sap.ui.getCore().byId('container-inveweb---vConsSap--oTable');
            
            for(let j = 0; j < quantity.length; j ++){
                
                if(quantity[j].matnr == this.row.matnr){
                
                    //Update the quantity model
                    counted = quantity[j].countedTot.replace(/,/g,"");
                    accountant = quantity[j].accountant.replace(/,/g,"");
                    
                    let cou = (sumQuantityUMB + parseFloat(counted) - parseFloat(accountant)).toFixed(3);
                    
                    quantity[j].diff = new Intl.NumberFormat("en-US", {minimumFractionDigits: '3'}).format(cou);
                    quantity[j].diffAux = cou;
                    
                    //Update the money model
                    accountant = money[j].accountant.replace(/,/g,"");
                    accountant = money[j].accountant.replace(/\$/g,"");
                    
                    money[j].diff = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '3'})
                    .format(cou	* parseFloat(money[j].costByUnit));
                    money[j].diffAux = (cou * parseFloat(money[j].costByUnit));
                    
                    if(cou == 0){
                        quantity[j].isc = false;
                    }else{
                        quantity[j].isc = true;
                    }
                            
                    break;		
                }
            }
                    
            if(!flgViewType) {
                oModel = new JSONModel(quantity);		
            }else{
                oModel = new JSONModel(money);							
            }										
            
            oTable.setModel(oModel,"oModel");					
            sap.ui.getCore().byId('container-inveweb---vConsSap').getController().flag = true;
            window.history.go(-1);		
        },
        
        setData: function(row){
            
            console.log("row", row);
            BusyIndicator.hide();				
            this.row = row;		
            let state = sap.ui.getCore().byId("container-inveweb---vConsSap--bSave").getEnabled();
            if(sap.ui.getCore().byId('container-inveweb---vConsSap').getController().lockButtonJWerks 
                    || sap.ui.getCore().byId('container-inveweb---vConsSap').getController().validateConciType()){
                this.byId("bAddJustify").setEnabled(false);
                this.byId("bDeleteJustify").setEnabled(false);
            }else{
                this.byId("bAddJustify").setEnabled(state);
                this.byId("bDeleteJustify").setEnabled(state);
            }
            
            let oTable = this.byId("oTableJustify");			        			 
            let model = new JSONModel(this.row.lsJustification == undefined? []: this.row.lsJustification);	
            oTable.setModel(model,"oModelJustify");
            
            this.byId("matnr").setText(this.row.matnr);
            this.byId("description").setText(this.row.matnrD);
        },
        
        selectRow: function(oEvent){
            //REDISEÑO, PENDIENTE DE MODIFICAR 
            let index = oEvent.getParameter("rowIndex");
            try {
                this.byId("oTableJustify").setSelectedIndex(index);
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
                laQuantity.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");
                let quantity = new StepInput({				
                    id: "quantityWerks",
                    displayValuePrecision: 3,
                    step : 1.000, // float
                    largerStep : 10.000, // float
                    //value : 0, // float
                    placeholder : "Cantidad U.M.B", // string, since 1.44.15
                    width : "95%", // CSSSize, since 1.54
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
                let lsJustifies = sap.ui.getCore().byId('container-inveweb---vConsSap').getController().lsJustifies;
                
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
                    id: "fEvidenceWerks",
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
                            this.addRecord(this.row.matnr, q, jsId, selText, jsD, this.file);
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
        
        addRecord: function(matnr, quantity, jsId, justify, jsDesc, file){
            
            //console.log("quantity ", quantity,  "justify ", justify, "file ", file);
            
            let oTable = this.getView().byId('oTableJustify'); 
            let data = [];
            
            try {
                data = oTable.getModel("oModelJustify").getData();
            } catch (e) {
                let oModel = new JSONModel(data);			
                oTable.setModel(oModel,"oModelJustify");
            }
            
            sap.ui.getCore().byId('container-inveweb---vConsSap').getController().jsCount++; //Increase the Justification counter
                    
            let obj = new Object();
            obj.matnr = matnr;
            obj.jsCount = sap.ui.getCore().byId('container-inveweb---vConsSap').getController().jsCount;
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
            
            oTable.getModel("oModelJustify").refresh(true);
        },
        
        removeJustify: function(){
            
            let oTable = this.byId('oTableJustify');  		
            let selectedItems = oTable.getSelectedItems();
            let allItems = oTable.getItems();
            //console.log("selectedItems",selectedItems);
            if(selectedItems.length > 0){
                
                //Empty backup record
                this.backupRecord = {};
                                            
                //Delete data
                let arr = [];
                let data = oTable.getModel("oModelJustify").getData();
                for(let i in allItems){
                    if(selectedItems.indexOf(allItems[i]) == -1){
                        arr.push(data[i]);
                    }
                }
                //console.log("items justify",arr);	
                oTable.setModel(new JSONModel(arr),"oModelJustify");
                
            }else{
                this.toast("Nada que eliminar", "20em");
            }
        }, 
            //REDISEÑO- AQUI ME QUEDÉ
        downloadFile: async function(oEvent){
            console.log("donwloadFile oEvent",oEvent);
            console.log("oEvent.getSource()",oEvent.getSource());
            let linkName = sap.ui.getCore().byId(oEvent.getSource().getId()).getText();
            let modelData = this.byId("oTableJustify").getModel("oModelJustify").getData();
            let index;
            for(let i in modelData){
                if(modelData[i].fileName == linkName){
                    index = i;
                    break;
                }
            }

            let fileName = modelData[index].fileName;
            let ext = fileName.split('.').pop().toLowerCase();								
            let local = this.byId("oTableJustify").getModel("oModelJustify").getData()[index].local;
            let downloadedDecodedFile;
            
            if(local == undefined){
                            
                let lsObject = [];
                lsObject.push(sap.ui.getCore().byId('container-inveweb---vConsSap--docInvId').getValue());
                lsObject.push(modelData[index].jsId.toString());
                lsObject.push(modelData[index].fileName);					

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
                
                downloadedDecodedFile = atob(modelData[index].base64File);
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