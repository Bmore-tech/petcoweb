sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageStrip",
	  "sap/m/MessageToast",
	  "sap/m/Dialog",
	  "sap/m/Button",
	  "sap/ui/core/Item",
	  "sap/ui/core/MessageType",
	  "sap/m/MessageBox",
      "sap/ui/core/util/Export",
      "sap/ui/core/util/ExportTypeCSV",
      "sap/ui/model/Filter",
      "sap/ui/model/FilterOperator",
      "sap/ui/model/FilterType",
      "sap/m/Label",
      "sap/m/Input",
      "sap/m/ComboBox",
      "sap/m/ButtonType", 
	],
	function (Controller,BusyIndicator,JSONModel,MessageStrip,MessageToast,Dialog,Button,
                Item,MessageType,MessageBox,Export,ExportTypeCSV,Filter,FilterOperator,FilterType,Label,Input,ComboBox,ButtonType) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vManageDRV", {
        onInit: function() {
            // Code to execute every time view is displayed
            this.getView().addDelegate({
                    
                onBeforeShow: async function(evt) {      
                    this.showLog = false;
                    this.oDialog = undefined;
                    this.cleanView();
                    this.loadDRVsByCountry();
                    await this.getRegions();
                    this.getAllDRVsIDs();   
                }.bind(this)
            });
        },

        returnAction : function() {
            window.history.go(-1);
            
        },

        cleanView: function(){
		
            this.byId("oTableDRVId").setModel(new JSONModel([]),"oModelDRVId");
            this.byId("oTable").setModel(new JSONModel([]),"oModel");
        },
        
        eraseNotification : function() {
            this.byId("vbFrame").setVisible(false);		
        },

        saveEdit: async function(){
            let enable = this.byId("oTableDRVId").getSelectedItems();
            let idDRV = enable[0].getCells()[0].getText();
            let drv = enable[0].getCells()[1].getValue();
            let country = enable[0].getCells()[2].getValue();
            let request = new Object();
            
            let drvObj = new Object();
            drvObj.DRV = drv;
            drvObj.country = country;
            drvObj.idDRV = idDRV;
            
            request.tokenObject = null;
            request.lsObject = drvObj;
            const json = await this.execService(InveServices.UPDATE_DRV,request,"updateDRV",this.showLog);
            if(json){
                let message = 'El DRV '+drv+' se actualizó de forma exitosa'; 
                    this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pManageDRV")); 
                    
                    setTimeout(function() {
                        this.byId("messagesBox").getItems()[0].close();  
                    }.bind(this),5000);  
                    
                    
            }



        },
        
        addDRV: async function(drv, country){
            
            let request = new Object();
            
            let drvObj = new Object();
            drvObj.DRV = drv;
            drvObj.country = country;
            
            request.tokenObject = null;
            request.lsObject = drvObj;

            const json = await this.execService(InveServices.ADD_DRV,request,"addDRV",this.showLog);

            if(json){
                
                if(json.abstractResult.intCom1 == 1){
                    MessageBox.show(json.abstractResult.resultMsgCom,
        					MessageBox.Icon.ERROR, "Duplicado");
                }else{
                    let message = 'El DRV '+drv+' se creó de forma exitosa'; 
                    this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pManageDRV")); 
                    
                    setTimeout(function() {
                        this.byId("messagesBox").getItems()[0].close();  
                    }.bind(this),5000);  
                    
                    this.getAllDRVsIDs();
                }
                
                
            }
        },
        
        loadDRVsByCountry: async function(){
            
            let request = new Object();
            
            request.tokenObject = null;
            request.lsObject = "";
            let json = await this.execService(InveServices.GET_DRV_FOR_MANAGEMENT,request,"loadDRVsByCountry",this.showLog);

            if(json){
                //console.log(json);
                for(let i in json.lsObject){
                    json.lsObject[i].idDRVAux = String(json.lsObject[i].idDRV);
                    json.lsObject[i].selected = false;
                    json.lsObject[i].enabled = false;
                }
                let oModel = new JSONModel(json.lsObject);
                
                let oTable = this.byId("oTable");
                oTable.setModel(oModel,"oModel");
            }

        },
        
        downloadTemplate: function(){
            
            let link = document.createElement("a");
            link.href = InveTemplates.TEMPLATE_DRV;
            link.click();	
        },
        
        openFilePicker: function(){
            
            $('#fileCentrosDRV').click();		
        },
        
        uploadTemplate: function(){
            
            this.eraseNotification();
    
            let file = $('#fileCentrosDRV').prop('files')[0];
            let allowedFiles=['csv'];
            let ext = file.name.split('.').pop().toLowerCase();
            let that = this;
            let arrTosend = [];
            
            // Check if is an allowed file
            if(allowedFiles.indexOf(ext) == -1){
                this.toast("Tipo de archivo no permitido, " +
                        "solo se permiten archivos de tipo: " +  allowedFiles, '20em');
                $('#fileCentrosDRV').val("");
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
                let size = allTextLines.length;
                
                if(allTextLines[size - 1].indexOf(",") == -1){
                    allTextLines.splice(-1);
                }	        
                
                
                BusyIndicator.show();
                            
                for (let i = 1; i < allTextLines.length; i++) {
    
                    data = allTextLines[i].split(',');
                    
                    if(data.length < 2){
                        BusyIndicator.hide();
                        that.toast("Datos faltantes para la entrada: " + (i+1), '20em');
                        return;
                    }
                    if(data[0] == undefined || data[0].length == 0 || isNaN(data[0])){
                        BusyIndicator.hide();
                        let message = 'El Id DRV debe ser un número en la linea: ' + (i + 1); 
                        that.message(message, MessageType.Error);
                        
                        return;
                    }
                    if(data[1].length != 4){
                        
                        BusyIndicator.hide();
                        let message = 'El centro debe ser de 4 caracteres en la linea: ' + (i + 1); 
                        that.message(message, MessageType.Error);
                        
                        return;
                    }	        		        	
                    
                    if(data[2].length == undefined || data[2].length < 2){
                        
                        BusyIndicator.hide();
                        let message = 'Ingrese un país válido en la linea: ' + (i + 1); 
                        that.message(message, MessageType.Error);
                        
                        return;
                    }	
                    
                    let object = new Object();
                    object.idDRV = parseInt(data[0]);	        	
                    object.werks = data[1];
                    object.country = data[2];
                    
                    arrTosend.push(object);
                                    
                }
                
                that.uploadDRVs(arrTosend);			
            }
            
            function errorHandler(evt) {
    
                if(evt.target.error.name == "NotReadableError") {
                    MessageBox.show('No se puede leer el archivo.',					
                            MessageBox.Icon.ERROR, "Error");
                }
    
            }		
            
            $('#fileCentrosDRV').val("");
        },
        
        uploadDRVs: async function(DRVs){
            
            let request = new Object();
            request.tokenObject = null;
            request.lsObject = DRVs;

            const json = await this.execService(InveServices.UPLOAD_DRVS,request,"uploadDRVs",this.showLog);

            if(json){
                let message; 
                if(DRVs.length == 1){
                   message = 'Centro agregado de forma exitosa.';
                }else{
                    message = 'El proceso de carga se realizó de forma exitosa.';
                }
                this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pManageDRV")); 
                
                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close();  
                }.bind(this),10000);  
                this.loadDRVsByCountry();            	
            }
            
        },
        
        filterTable: function(oEvent){
            let value = oEvent.getSource().getValue();
            let allFilter = new Filter([
                                        new Filter("idDRVAux",  FilterOperator.Contains, value),
                                        new Filter("DRV",  FilterOperator.Contains, value),
                                        new Filter("werks",  FilterOperator.Contains, value),
                                        new Filter("werksDesc",  FilterOperator.Contains, value),
                                        new Filter("country",  FilterOperator.Contains, value)
                                    ]);        
            let oTable = oEvent.getSource().getParent().getParent();

            oTable.getBinding("items").filter(allFilter, FilterType.Application);
        },
        
        getAllDRVsIDs: async function(){
            let json = await this.execService(InveServices.GET_ALL_DRVS_IDS,{},"getAllDRVsIDs",this.showLog);

            if(json){
                this.DRVs = this.copyObjToNew(json.lsObject);
                for(let i in json.lsObject){
                    json.lsObject[i].idDRVAux = String(json.lsObject[i].idDRV);
                }
                let oModel = new JSONModel(json.lsObject);
                
                let tableDRVId = this.byId("oTableDRVId");
                let oPais = [];
                for(let i in this.regions){
                    oPais.push({key: this.regions[i]});
                }
                
                tableDRVId.setModel(oModel, "oModelDRVId");
                this.getView().setModel(new JSONModel(oPais), "oModelCmb");
                
            }	
        },

        showDialogAdd: function(){
            if(!this.oDialog){
                let laDRV = new Label({
                    text : "Nombre DRV", // string
                    width : "95%"
                });
                laDRV.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");

                let inDRV = new Input({
                    width : "95%",
                    value : "",
                });
                inDRV.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");
                
                let laPais = new Label({
                    text : "Seleccione País", // string
                    width : "95%"
                });
                laPais.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");

                let cmbPais = new ComboBox({
                    width : "95%"
                });

                for(let i in this.regions){
                    let item = new Item({
                        text : this.regions[i], // string
                        key : this.regions[i], // string
                        tooltip : this.regions[i], // sap.ui.core.TooltipBase										
                        });
                        cmbPais.addItem(item);
                }
                cmbPais.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");

                this.oDialog = new Dialog({
                    title : "Agregar DRV", // string
                    contentWidth : "35%", // CSSSize, since 1.12.1
                    content : [laDRV, inDRV, laPais, cmbPais], // Control
                    beginButton: new Button({
                        text: 'Cerrar',
                        press: function () {						
                            this.oDialog.close();						
                        }.bind(this),
                        
                    }),
                    endButton: new Button({
                        text: 'Aceptar',
                        press: function () {
                            let d = inDRV.getValue();
                            if(d == null || d.length == 0 || d.includes(" ")){
                                MessageBox.show('Es necesario ingresar un nombre para el DRV, sin contener espacios',
                                        MessageBox.Icon.ERROR, "Falta nombre");
                                return;
                            }
                            let p = cmbPais.getSelectedKey();
                            if(p == undefined || p == null || p== ""){
                                MessageBox.show('Es necesario seleccionar pais',
                                        MessageBox.Icon.ERROR, "Falta País");
                                return;
                            }
                            this.addDRV(d,p);
                            this.oDialog.close();						
                        }.bind(this),
                        type: ButtonType.Emphasized
                    })
                })
            }
            this.oDialog.getContent()[1].setValue(null);
            this.oDialog.getContent()[3].setSelectedKey(null);
            this.oDialog.open();
        },

        getRegions: async function(){
            const json = await this.execService(InveServices.GET_REGIONS_BY_REGIONS_OR_SAP_COUNTRY,{},"getRegions",this.showLog);

            if(json){
                this.regions = this.copyObjToNew(json.lsObject);
                //console.log("llenado de regions",this.regions);
            }
        },

        editDRV: function(evt){
            let oTable = evt.getSource().getParent().getParent();
            this.bckpModelDRV = this.copyObjToNew(oTable.getModel("oModelDRVId").getData());
            let btnEdit = evt.getSource();
            

            if(btnEdit.getTooltip() == "Editar DRV"){
                oTable.setMode("SingleSelectLeft");
                this.byId("btnAddRegion").setEnabled(false);
                this.byId("cancel").setIcon("sap-icon://cancel");
                this.byId("cancel").setTooltip("Cancelar edición");

                

                return;
            }

        },
        
        initRemove:function(evt){
            let btnRemove = evt.getSource();
            let oTable = evt.getSource().getParent().getParent();

             if(this.byId("cancel").getTooltip() == "Cancelar edición"){
                oTable.setModel(new JSONModel(this.backupModelDataWerks),"oModel");
                oTable.getModel("oModel").refresh(true);
                btnRemove.setIcon("sap-icon://less");
                btnRemove.setTooltip("Quitar centros");
                oTable.setMode("None");
                this.byId("btnSaveWerks").setEnabled(false);
                this.byId("btnAddWerk").setEnabled(true);
                this.byId("btnSaveBorradoRegion").setEnabled(false);
                this.byId("btnSaveBorradoRegion").setTooltip("Guardar");
                let unlocke = this.byId("oTableDRVId").getItems();
                for( let i in unlocke){
                unlocke[i].getCells()[1].setEnabled(false);
                unlocke[i].getCells()[2].setEnabled(false);
                }
                return;

                
            }

            if(btnRemove.getTooltip() == "Cancelar borrado"){
                oTable.setModel(new JSONModel(this.backupModelData),"oModelDRVId");
                oTable.getModel("oModelDRVId").refresh(true);
                btnRemove.setIcon("sap-icon://less");
                btnRemove.setTooltip("Quitar regiones");
                oTable.setMode("None");
                this.byId("editDrv").setEnabled(true);
                this.byId("btnSaveBorradoRegion").setEnabled(false);                
                this.byId("btnAddRegion").setEnabled(true);
                return;
            }
            
            MessageBox.confirm("Al borrar regiones (DRV) también se borrará la relación de los centros asociados\n\n¿Desea continuar?", {
				actions: ["Si", "No"],
				onClose: function (sAction) {
					if(sAction === "Si"){
                        this.byId("btnAddRegion").setEnabled(false);
                        this.backupModelData = this.copyObjToNew(oTable.getModel("oModelDRVId").getData());
                        this.byId("btnSaveBorradoRegion").setEnabled(true);
                        this.byId("editDrv").setEnabled(false);
                        btnRemove.setIcon("sap-icon://cancel");
                        btnRemove.setTooltip("Cancelar borrado");
                        oTable.setMode("Delete");
                        this.backup_oTable = oTable;
                        this.backup_BtnRemove = btnRemove;
                        this.regionRemove = [];
                  }  			        	  			        	  
                }.bind(this)						
          }
        );
            
        },
        selectRemove: function(evt){
           
            let path = evt.getParameter('listItem').getBindingContext("oModelDRVId").getPath();
            let idx = parseInt(path.substring(path.lastIndexOf('/') +1));
            let m = evt.getSource().getModel("oModelDRVId");
            
            let d = m.getData();
            this.regionRemove.push(d[idx]);
            d.splice(idx, 1);
            m.setData(d);
        },

        execDeleteRegions: async function(){
            if(this.byId("btnSaveBorradoRegion").getTooltip() == "Guardar edición"){
                
                let enable = this.byId("oTableDRVId").getSelectedItems();
                let idDRV = enable[0].getCells()[0].getText();
                let drv = enable[0].getCells()[1].getValue();
                let country = enable[0].getCells()[2].getValue();
                let request = new Object();
            
                let drvObj = new Object();
                drvObj.DRV = drv;
                drvObj.country = country;
                drvObj.idDRV = idDRV;
            
                request.tokenObject = null;
                request.lsObject = drvObj;
                const json = await this.execService(InveServices.UPDATE_DRV,request,"updateDRV",this.showLog);
                if(json){
                    let message = 'El DRV '+drv+' se actualizó de forma exitosa'; 
                        this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pManageDRV")); 
                        this.FLAG_NEW_EDIT = false;
                        setTimeout(function() {
                            this.byId("messagesBox").getItems()[0].close();  
                        }.bind(this),5000);  
                        
                        
                }
                this.byId("btnSaveBorradoRegion").setTooltip("Guardar");
                this.byId("cancel").setTooltip("Quitar regiones");
                this.byId("btnAddRegion").setEnabled(true);
                this.byId("btnSaveBorradoRegion").setEnabled(false);
                return;

            }

            if(this.regionRemove == undefined || this.regionRemove.length == 0){
                MessageBox.show('No hay regiones seleccionadas para borrar',
                MessageBox.Icon.WARNING, "Advertencia");
                 return;
            }
            
            const request = {
                tokenObject : null,
                lsObject : this.regionRemove
            }
            const json = await this.execService(InveServices.DELETE_REGIONS,request,"getRegions",this.showLog);

            if(json){
                let message = 'Regiones borradas exitosamente'; 
                this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pManageDRV"));
                this.byId("srchRegions").setValue("");
                this.backup_oTable.setMode("None");
                this.backup_BtnRemove.setIcon("sap-icon://less");
                this.backup_BtnRemove.setTooltip("Quitar regiones");
                this.byId("btnSaveBorradoRegion").setEnabled(false);
                this.byId("btnAddRegion").setEnabled(true);
                this.byId("editDrv").setEnabled(true);
                this.loadDRVsByCountry();
                await this.getAllDRVsIDs();
                await this.getRegions();
                
                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close();  
                }.bind(this),5000); 
            }
        },

        updateTable: function(evt){
           
            let oTable = evt.getSource();
            
            //Aseguramos que todos los items de la tyabla esten bloqueados
            let unlocke = oTable.getItems();
            console.log("unlocke",unlocke);
            for( let i in unlocke){
                unlocke[i].getCells()[1].setEnabled(false);
                unlocke[i].getCells()[2].setEnabled(false);
            }
            console.log("editar");
           
           
            //oTable.getModel("oModel").refresh(true);
            
            let enable = oTable.getSelectedItems();
            console.log("enable",enable);
            enable[0].getCells()[1].setEnabled(true);
            enable[0].getCells()[2].setEnabled(true);
            this.byId("editDrv").setEnabled(false);
            this.byId("btnSaveBorradoRegion").setTooltip("Guardar edición");
            this.byId("btnSaveBorradoRegion").setEnabled(true);
            this.byId("editDrv").setEnabled(true);
            this.byId("btnAddRegion").setEnabled(false);
            
            this.byId("cancel").setTooltip("Cancelar edición");

            if(!this.FLAG_NEW_EDIT){
                this.FLAG_NEW_EDIT = true;
               
            }else{
                oTable.setModel(new JSONModel(this.bckpModelDRV),"oModelDRVId");
                oTable.getModel("oModelDRVId").refresh(true);

                this.byId("cancel").setIcon("sap-icon://less");
                this.byId("cancel").setTooltip("Quitar centros");
                oTable.setMode("None");
                this.byId("btnSaveWerks").setEnabled(false);
                this.byId("btnAddWerk").setEnabled(true);
                this.byId("btnSaveBorradoRegion").setEnabled(false);
                this.byId("btnSaveBorradoRegion").setTooltip("Guardar");
                
            }

        },

        initRemoveWerks: function(evt){
            let btnRemove = evt.getSource();
            let oTable = evt.getSource().getParent().getParent();

           

            if(btnRemove.getTooltip() == "Cancelar borrado"){
                oTable.setModel(new JSONModel(this.backupModelDataWerks),"oModel");
                oTable.getModel("oModel").refresh(true);
                btnRemove.setIcon("sap-icon://less");
                btnRemove.setTooltip("Quitar centros");
                oTable.setMode("None");
                this.byId("btnSaveWerks").setEnabled(false);
                this.byId("btnAddWerk").setEnabled(true);
                return;
            }
            this.regionRemoveWerks = [];
            this.backupModelDataWerks = this.copyObjToNew(oTable.getModel("oModel").getData());
            this.byId("btnSaveWerks").setEnabled(true);
            btnRemove.setIcon("sap-icon://cancel");
            btnRemove.setTooltip("Cancelar borrado");
            oTable.setMode("Delete");
            this.backup_oTableWerks = oTable;
            this.backup_BtnRemoveWerks = btnRemove;
            this.byId("btnAddWerk").setEnabled(false);
        },

        selectRemoveWerks: function(evt){
            
            let path = evt.getParameter('listItem').getBindingContext("oModel").getPath();
            let index = parseInt(path.substring(path.lastIndexOf('/') +1));
            let m = evt.getSource().getModel("oModel");
            
            let d = m.getData();
            this.regionRemoveWerks.push(d[index]);
            d.splice(index, 1);
            m.setData(d);
        },

        saveWerks: function(){
            MessageBox.confirm("¿Confirmar borrado de centros?", {
				actions: ["Si", "No"],
				onClose: async function (sAction) {
					if(sAction === "Si"){
                        if(this.regionRemoveWerks == undefined || this.regionRemoveWerks.length == 0){
                            MessageBox.show('No hay centros seleccionados para borrar',
                            MessageBox.Icon.WARNING, "Advertencia");
                             return;
                        }
                        let oTable = this.backup_oTableWerks;
                        let btnRemove = this.backup_BtnRemoveWerks;

                        let request = new Object();
                        request.tokenObject = null;
                        request.lsObject = this.regionRemoveWerks;

                        const json = await this.execService(InveServices.DELETE_WERKS_IN_DRV,request,"deleteWerksInDRV",this.showLog);

                        if(json){
                            let message = 'Se eliminaron los centros seleccionados.'; 
                            this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pManageDRV"));
                            //this.byId("btnSaveWerks").setEnabled(true);
                            //btnRemove.setIcon("sap-icon://cancel");
                            //btnRemove.setTooltip("Cancelar borrado");
                            this.byId("btnSaveWerks").setEnabled(false);
                            btnRemove.setIcon("sap-icon://less");
                            btnRemove.setTooltip("Quitar centros");
                            oTable.setMode("None");
                            this.byId("srchWerks").setValue("");
                            this.byId("btnAddWerk").setEnabled(true);
                            this.loadDRVsByCountry();
                            
                            setTimeout(function() {
                                this.byId("messagesBox").getItems()[0].close();  
                            }.bind(this),5000);  
                        }
                        
                  }  			        	  			        	  
                }.bind(this)						
          },
          
        );
        },

        showDialogAddWerks: function(){
            if(!this.oDialogWerks){
                let laDRV = new Label({
                    text : "Seleccione DRV", // string
                    width : "95%"
                });
                laDRV.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");

                let cmbDRV = new ComboBox(this.getView().createId("cmboxWerks"),{
                    width : "95%",
                });
                cmbDRV.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");
               

                let laCentro = new Label({
                    text : "Ingrese Centro", // string
                    width : "95%"
                });

                laCentro.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");

                let inCentro = new Input({
                    width : "95%",
                    value : ""
                });

                inCentro.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");

                let laPais = new Label({
                    text : "Seleccione País", // string
                    width : "95%"
                });
                laPais.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");

                let cmbPais = new ComboBox({
                    width : "95%"
                });
                console.log("consulta de regions",this.DRVs);
                for(let i in this.regions){
                    let item = new Item({
                        text : this.regions[i], // string
                        key : this.regions[i], // string
                        tooltip : this.regions[i], // sap.ui.core.TooltipBase										
                        });
                        cmbPais.addItem(item);
                }
                cmbPais.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");

                this.oDialogWerks = new Dialog({
                    title : "Agregar DRV", // string
                    contentWidth : "35%", // CSSSize, since 1.12.1
                    content : [laDRV, cmbDRV, laCentro, inCentro, laPais, cmbPais], // Control
                    beginButton: new Button({
                        text: 'Cerrar',
                        press: function () {						
                            this.oDialogWerks.close();						
                        }.bind(this),
                        
                    }),
                    endButton: new Button({
                        text: 'Aceptar',
                        press: function () {
                            let d = cmbDRV.getSelectedKey();
                            if(d == undefined || d == null || d == ""){
                                MessageBox.show('Es necesario seleccionar DRV',
                                        MessageBox.Icon.ERROR, "Falta DRV");
                                return;
                            }
                            let c = inCentro.getValue().toUpperCase();
                            if(c == undefined || c == null || c.length != 4){
                                MessageBox.show('Es necesario ingresar un centro válido',
                                        MessageBox.Icon.ERROR, "Falta Centro");
                                return;
                            }
                            let p = cmbPais.getSelectedKey();
                            if(p == undefined || p == null || p== ""){
                                MessageBox.show('Es necesario seleccionar pais',
                                        MessageBox.Icon.ERROR, "Falta País");
                                return;
                            }
                            const object = {
                                idDRV : d,	        	
                                werks : c,
                                country : p
                            }
                            this.oDialogWerks.close();
                            this.uploadDRVs([object]);
                            						
                        }.bind(this),
                        type: ButtonType.Emphasized
                    })
                })
            }
            this.oDialogWerks.getContent()[1].setSelectedKey(null);
            this.oDialogWerks.getContent()[3].setValue("");
            this.oDialogWerks.getContent()[5].setSelectedKey(null);
            let cmbDRV = this.byId("cmboxWerks");
            cmbDRV.setSelectedKey(null);
			cmbDRV.removeAllItems();
	        cmbDRV.destroyItems();
            for(let i in this.DRVs){
                let item = new Item({
                    text : this.DRVs[i].DRV, // string
                    key : this.DRVs[i].idDRV, // string
                    tooltip : this.DRVs[i].idDRV+' - '+this.DRVs[i].DRV, // sap.ui.core.TooltipBase										
                    });
                    cmbDRV.addItem(item);
            }
            this.oDialogWerks.open();
        },

        refreshWerks:function(){
            this.loadDRVsByCountry();
            this.byId("btnSaveWerks").setTooltip("Guardar");
            this.byId("btnAddRegion").setEnabled(true);
          },

        refreshRegions:function(){
            this.getAllDRVsIDs();
        },

        downloadExcel:function(){
            let modelData = this.byId("oTable").getModel("oModel").getData();
            if(modelData == undefined || modelData.length == 0){
                this.toast('Sin información para exportar.', "20em");
                return;
              }
              let model = modelData;
              let reformattedArray;
        
              reformattedArray = model.map(function(obj){
                obj["ID DRV"] = obj["idDRV"];
                obj["DRV "] = obj["DRV"];
                obj["Centro"] = obj["werks"];
                obj["Desc. Centro"] = obj["werksDesc"];
                obj["País"] = obj["country"];
                //obj["Bloqueado"] = obj["locked"];
                obj["Modificado por"] = obj["modifiedBy"];
                obj["Fecha de modificación"] = obj["modifiedDate"];
                
                delete obj["idDRV"];
                delete obj["DRV"];
                delete obj["werks"];
                delete obj["werksDesc"];
                delete obj["locked"];
                delete obj["modifiedBy"];
                delete obj["modifiedDate"];
                delete obj["country"];
                delete obj["idDRVAux"];
                delete obj["selected"];
                delete obj["enabled"];
                
                return obj;
               });
              
              let ws = XLSX.utils.json_to_sheet(reformattedArray);
              let wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "DRV-Centros");
              
              XLSX.writeFile(wb, "DRV-Centros - "+this.formatDate(new Date())+".xlsx");
        }

      })
    }
);