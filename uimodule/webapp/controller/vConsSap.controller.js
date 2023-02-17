sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageStrip",
	  "sap/m/MessageToast",
	  "sap/m/Dialog",
	  "sap/m/Button",
	  "sap/ui/core/MessageType",
	  "sap/m/MessageBox",
      "sap/m/Table",
      "sap/m/Toolbar",
      "sap/m/SearchField",
      "sap/m/Column",
      "sap/m/ObjectIdentifier",
      "sap/m/Text",
      "sap/m/ColumnListItem",
      "sap/ui/core/Fragment",
      'sap/ui/Device',
      "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV",
	],
	function (Controller,BusyIndicator,JSONModel,MessageStrip,
                    MessageToast,Dialog,Button,MessageType,MessageBox,Table,
                    Toolbar,SearchField,Column,ObjectIdentifier,Text,ColumnListItem,Fragment,Device,Export,ExportTypeCSV) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vConsSap", {

        onInit : function() {
            this.showLog = false;
            if (this.onInitFlag == undefined) {
                this.onInitFlag = true;
                this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
                this.loadJustifies();
                this.quantity = [];
                this.money = [];
                this.lastJustifyActive = "Centro";
                this.backUpDiffWerks = [];
                this.backUpDiffLgpla = [];
                this.werksEmpty = true;
                this.lgplaEmpty = true;
                this.currentActiveTab = "tabC";
                this.activeDocInvId = undefined;
                this.mapTables = new Map();
            } else {
                
                return;
            }
    
            // Code to execute every time view is displayed
            this.getView().addDelegate({
    
                onBeforeShow : function(evt) {
                            
                        BusyIndicator.hide();
                        this.showLog = false;
                        if(this.fromJustifyLgpla){// viniendo de justificaciones por ubicacion, redireccionar al tab de conci por ubicacion
    
                            this.fromJustifyLgpla = false;
                            this.byId("tabBar").setSelectedKey("tabCByLgpla");
                        }
                        
                        if (!this.flag) {
                            this.jsCount = 0;
                            this.cleanView();
                            this.cleanViewLgpla();
                            this.hideFinancialColumnsLgpla();
                        }
                }.bind(this)
            });
        },
        ///////////////////////////////////////////////////////////////////INICIO FUNCIONES DEL CONTROLADOR DE vMatExpl/////////////////////////////////////////////////
         cleanViewvMatExpl: function(){
            
            // Reset the Explosion tab
            setTimeout(function() {
    
                let oModel = new JSONModel([]);
    
                let oTable = this.byId("oTableExplRep");
                oTable.setModel(oModel,"oModelExplRep");
    
            }.bind(this),100);
        }, 
        loadReport: async function(){
            BusyIndicator.show(0);	
            let table;

            const request = {
                tokenObject: null,
                lsObject: this.byId("docInvId").getValue()
            };

            const json = await this.execService(InveServices.GET_EXPLOSION_REPORT_BY_WERKS,request,"loadReport",this.showLog);

            if(json){
                //Create a model and bind the table rows to this model
                //console.log('getExplosionReportByWerks',json);    
                        
                table = json.lsObject;
                let modelDataConSAP;
                
                try {
                    modelDataConSAP =  this.quantity;
                } catch (e) {
                    modelDataConSAP = [];
                }
                                                        
                for(let i = 0; i < modelDataConSAP.length; i++){
                    
                    for(let j = 0; j < table.length; j++){
                        
                        if(table[j].matnr == modelDataConSAP[i].matnr){
                            
                            table[j].description = modelDataConSAP[i].matnrD;
                            table[j].category = modelDataConSAP[i].category;
                            table[j].umb = modelDataConSAP[i].meins;
                            table[j].counted = modelDataConSAP[i].counted.replace(/,/g,"");            					            					
                        }
                    }            			            			
                }
                
                
                let item = 1;
                for(let i = 0; i < table.length; i++){
                    
                    if(table[i].matnrExpl.length == 0){
                        
                        table[i].matnrExpl = "-";
                        table[i].descMantrExpl = "-";
                        table[i].quantity = "-";
                        table[i].quantityAux = 0;
                        table[i].umbExpl = "-";
                    }
                    
                    table[i].item = item.toString();            		
                    
                    table[i].counted = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                    .format(table[i].counted);
                    
                    table[i].countedAux = parseFloat(table[i].counted.replace(/,/g,""));             			
                    
                    if(table[i].quantity != '-'){
                        
                        table[i].quantity = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                        .format(table[i].quantity);
                        
                        table[i].quantityAux = parseFloat(table[i].quantity.replace(/,/g,""));
                    }else{
                        
                        table[i].quantityAux = 0;
                    }
                    
                    if(i < (table.length + 1)){
                        try {
                            
                            if(table[i].matnr != table[i + 1].matnr){
                                item ++;
                            }	
                        } catch (e) {
                            console.warn(e);
                        }
                    }
                }

                let oTable = this.byId("oTableExplRep");
                
                
                this.tableExplWerks = table//Fase 3
                let oModel = new JSONModel(table);

                oTable.setModel(oModel,"oModelExplRep");	
                BusyIndicator.hide();
            }
        
        },
        downlMatnrExpl: function(oEvent){
            
            let oTable = this.byId("oTableExplRep");		
            let modelData;
            try {
                modelData = oTable.getModel("oModelExplRep").getData();
            } catch (e) {
                modelData = [];
            }
            
            if(modelData.length == 0){
                this.toast("Nada que exportar...", "20em");
                return;
            }
            
            let report="";
            //Set the header
            report += "Documento de Inventario:," + this.byId("docInvId").getValue() + "\r\n";
            report += "Tipo:," + this.byId("type").getValue() + "\r\n";
            report += "Fecha de cierre:," + this.byId("dEnd").getValue() + "\r\n";
            report += "Sociedad:," + this.byId("bukrs").getValue() + "\r\n";
            report += "Centro:," + this.byId("werks").getValue() + "\r\n";		
            report += "\r\n";
            report += "Item, Material, Descripción, Categoría, UMB, Contado, Material Explosionado, Descripción, UMB, Cantidad" + "\r\n";
            
            //Set the body report
            for(let i = 0; i < modelData.length; i ++){
                
                report += modelData[i].item + ","
                report += modelData[i].matnr + ","
                report += modelData[i].description + ","
                report += modelData[i].category +",";
                report += modelData[i].umb + ","
                report += modelData[i].counted.replace(/,/g,"") + ","
                
                if(modelData[i].matnrExpl != undefined){
                
                    report += modelData[i].matnrExpl + ","
                    report += modelData[i].descMantrExpl + ","
                    report += modelData[i].umbExpl + ","
                    report += modelData[i].quantity.replace(/,/g,"") + ","
                }
                                        
                report += "\r\n";
            }
            
            let textFileAsBlob = new Blob(["\ufeff", report ], {  
                type: 'text/plain;charset=ISO-8859-1', 
                encoding: "ISO-8859-1"});
            
            let fileNameToSaveAs = "Explosion_Centro_DocInv_" + this.byId("docInvId").getValue() + '.csv';		
            let downloadLink = document.createElement("a");
            downloadLink.download = fileNameToSaveAs;
            //downloadLink.innerHTML = "File to download";
            if (window.webkitURL != null) {
              // Chrome allows the link to be clicked without actually adding it to the DOM.
              downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
            } else {
              // Firefox requires the link to be added to the DOM before it can be clicked.
              downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
              downloadLink.onclick = destroyClickedElement;
              downloadLink.style.display = "none";
              document.body.appendChild(downloadLink);
            }
            downloadLink.click();
        },
        getExplDataTable: function(){
            
            let modelData;
            
            try {
                modelData = this.byId("oTableExplRep").getModel("oModelExplRep").getData();
            } catch (error) {
                
                MessageBox.show(error,
                        MessageBox.Icon.ERROR, "Error");
            }
            
            return modelData;
    },
    saveReportExplWerks: async function(){
        //console.log("Entrando a saveReportExplWerks");
        if(this.quantity == undefined){
            console.log("Sin datos en quantity para obtener explosionado por Centro");
            return;
        }
        
        const request = {
            tokenObject: null,
            lsObject: this.currentDocInvId
        };

        const json = await this.execService(InveServices.GET_EXPLOSION_REPORT_BY_WERKS,request,"saveReportExplWerks",this.showLog);

        if(json){   
                    
            let table = json.lsObject;
            let modelDataConSAP;
            
            try {
                modelDataConSAP =  this.quantity;
            } catch (e) {
                modelDataConSAP = [];
            }
                                                    
            for(let i = 0; i < modelDataConSAP.length; i++){
                
                for(let j = 0; j < table.length; j++){
                    
                    if(table[j].matnr == modelDataConSAP[i].matnr){
                        
                        table[j].description = modelDataConSAP[i].matnrD;
                        table[j].category = modelDataConSAP[i].category;
                        table[j].umb = modelDataConSAP[i].meins;
                        table[j].counted = modelDataConSAP[i].counted.replace(/,/g,"");            					            					
                    }
                }            			            			
            }
            
            
            let item = 1;
            for(let i = 0; i < table.length; i++){
                
                if(table[i].matnrExpl.length == 0){
                    
                    table[i].matnrExpl = "-";
                    table[i].descMantrExpl = "-";
                    table[i].quantity = "-";
                    table[i].quantityAux = 0;
                    table[i].umbExpl = "-";
                }
                
                table[i].item = item.toString();            		
                
                table[i].counted = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                .format(table[i].counted);
                
                table[i].countedAux = parseFloat(table[i].counted.replace(/,/g,""));             			
                
                if(table[i].quantity != '-'){
                    
                    table[i].quantity = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                    .format(table[i].quantity);
                    
                    table[i].quantityAux = parseFloat(table[i].quantity.replace(/,/g,""));
                }else{
                    
                    table[i].quantityAux = 0;
                }
                
                if(i < (table.length + 1)){
                    try {
                        
                        if(table[i].matnr != table[i + 1].matnr){
                            item ++;
                        }	
                    } catch (e) {
                        console.warn(e);
                    }
                }
            }
            let oTable = this.byId("oTableExplRep");
            let oModel = new JSONModel(table);
            
            oTable.setModel(oModel,"oModelExplRep");
            this.sendTable(table);//Fase 3
            BusyIndicator.hide();
        }
    },
    sendTable: async function(table){
       
        for(let i in table){
            table[i].docInvId = this.currentDocInvId;//sap.ui.getCore().byId("vConsSap--docInvId").getValue();
        }

        const request = {
            tokenObject: null,
            lsObject: table
        };

        const json = await this.execService(InveServices.SAVE_EXPLOSION_REPORT_BY_WERKS,request,"saveExplosionReportByWerks",this.showLog);

        if(json){       
            BusyIndicator.hide();
        }
    },
    ////////////////////////////////////////////////////////////////////FIN FUNCIONES DEL CONTROLADOR DE vMatExpl/////////////////////////////////////////////////
        eraseNotification : function() {
            this.byId("vbFrame").setVisible(false);
        },
    
        returnAction : function() {
            if(this.byId("bSave").getEnabled()){
                this.setOnEdit(true);
            }else{
                this.setOnEdit(false);
            }
            
            this.flag = false;
            window.history.go(-1);
        },
    
        toast : function(message, width) {
    
            MessageToast.show(message, {
                duration : 3000, // default
                width : width, // default
                my : "center bottom", // default
                at : "center center", // default
                of : window, // default
                offset : "0 0", // default
                collision : "fit fit", // default
                onClose : null, // default
                autoClose : true, // default
                animationTimingFunction : "ease", // default
                animationDuration : 1000, // default
                closeOnBrowserNavigation : true
            // default
            });
        },
        
        conciTypeMessage : function(message, type) {
            let mTrip = new MessageStrip({
                text : message, // string
                type : type, // MessageType
                showIcon : true, // boolean
                showCloseButton : false, // boolean
            });
            
            let conciType = this.byId("lblSelectedConci");
            conciType.removeAllItems();
            conciType.addItem(mTrip);
            conciType.setVisible(true);
            
            setTimeout(function() {
                this.byId("pConciliation").scrollToElement(conciType);
            }.bind(this),50);
    
        },
        
        cleanAll: function(){
            
            this.cleanView();		
        },
    
        cleanView : function() {
    
            this.eraseNotification();
            
            this.quantity = [];
            this.money = [];
            
            this.byId("bSave").setEnabled(false);
            this.byId("docInvId").setValue("");
            this.byId("bukrs").setValue("");
            this.byId("werks").setValue("");
            this.byId("dStart").setValue("");
            this.byId("dEnd").setValue("");
            this.byId("type").setValue("");
            this.byId("createdBy").setValue("");
            this.byId("tabBar").setExpanded(true);
            this.byId("tabBar").setSelectedKey("tabC");
            this.byId("matExpl").setEnabled(false);
            this.byId("matExplByLgpla").setEnabled(false);
            this.byId("lblSelectedConci").removeAllItems();
            this.byId("lblSelectedConci").setVisible(false);
            this.byId("chkWerks").setState(false);
            
            // Empty table
            let oModel = new JSONModel([]);
    
            this.byId("oTable").setModel(oModel,"oModel");
    
            this.byId("cTheoric").setVisible(false); // Fixes the bug
            setTimeout(function() {
                this.byId("cTheoric").setVisible(true);
            }.bind(this),100);
    
            this.byId("bUpload").setEnabled(false);
            this.byId("tbSH").setPressed(false);
            
        },
    
        loadJustifies: async function() {

            const request = {
                tokenObject: null,
                lsObject: ""
            };

            const json = await this.execService(InveServices.GET_JUSTIFIES,request,"loadJustifies",this.showLog);
              
            if(json){
                this.lsJustifies = json.lsObject;
                BusyIndicator.hide();
            }
    
        },
    
        disableInput : function() {
    
            setTimeout(function() {
                
                $("#vConsSap--docInvId-inner").attr("readonly",	"readonly");
            }, 100);
        },
    
        checkTab : function(oEvent) {
    
            let key = oEvent.getParameters().key;
            let oTable;
            let data;
            switch(key){		
            case 'tabC':
                this.preloadDoc("tabC");
                this.currentActiveTab = "tabC";
                break;
    //			
            case 'tabCByLgpla':
                this.preloadDoc("tabCByLgpla");
                this.currentActiveTab = "tabCByLgpla";
                
                break;
                
            case 'itbExpl':
                
                oTable = this.byId("oTableExplRep");
    
                try {
                    data = oTable.getModel("oModelExplRep").getData();
                } catch (e) {
                    data = [];
                }
                if(data.length != 0){
                    this.flagExplCentro = true;//De fase 3
                }else{
                    this.flagExplCentro = false;
                }
                if (data.length == 0
                        && this.byId("docInvId").getValue().length > 0) {
                    /*vMatExpl this.oCtrl*/ this.loadReport();
                }
                
                break;
                
            case 'itbExplByLgpla':
                
                oTable = this.byId("oTableExplRepByLgpla");
                let docIdLgpla = this.byId("docInvIdByLgpla");
    
                try {
                    data = oTable.getModel("oModelMatExplLgpla").getData();
                } catch (e) {
                    data = [];
                }
                if(data.length != 0){
                    this.flagExplLgpla = true;//De fase 3
                }else{
                    this.flagExplLgpla = false;
                }
                if (data.length == 0
                        && docIdLgpla.getValue().length > 0) {
                    this.loadReportMatExplByLgpla();
                }
                
                break;
                
            default:
                
                this.disableInput();
                break;	
            }
            
        },
    
        confirmClose : function() {
    
            this.eraseNotification();
            
            // Show confirm dialog
            MessageBox.confirm("¿Desea cerrar el Documento de Inventario?", {
                icon : MessageBox.Icon.QUESTION,
                actions : [ MessageBox.Action.YES, MessageBox.Action.NO ],
                onClose : function(oAction) {
                    if (oAction == 'YES') {
                        
                        this.closeDocumment();
                    }
                }.bind(this)
            });
        },
        
        closeDocumment: async function() {
            
            if(this.validateConciType()){
                MessageBox.show('Debe de elegir un tipo de conciliación',
                                        MessageBox.Icon.WARNING, "Falta información");
                
                return;
            }
            BusyIndicator.show(0)
            
            
            let model;
            let DocInvBeanHeaderSAP = new Object();
            if(this.byId("chkWerks").getState()){
                
                DocInvBeanHeaderSAP.docInvId = this.byId("docInvId").getValue();
                DocInvBeanHeaderSAP.conciType = "werks";

                //Asegurar que al guardar sea SIN la vista financiera activada, para no afectar el dashboard con caracteres $
                let state = this.byId("tbSH").getPressed();
                if(!state){
                    this.showFinan();
                }
                
                
                try {
                    model = this.copyObjToNew(this.quantity);
                } catch (e) {
                    model = [];
                }
                
            }else if(this.byId('chkLgpla').getState()){
                
                DocInvBeanHeaderSAP.docInvId = this.byId("docInvIdByLgpla").getValue();
                DocInvBeanHeaderSAP.conciType = "lgpla";

                //Asegurar que al guardar sea SIN la vista financiera activada, para no afectar el dashboard con caracteres $
                let state = this.byId("tbSHByLgpla").getPressed();
                if(!state){
                    this.showFinan();
                }

                
                try {
                    model = this.copyObjToNew(this.quantityLgpla);
                    this.cleanFormatLgpla(model);
                } catch (e) {
                    model = [];
                }
            }
            
            this.currentDocInvId = DocInvBeanHeaderSAP.docInvId;
            
                    
            //Get the files
            let arrFiles = [];
            let jsFile;
            
            for(let i = 0; i < model.length; i ++){
                if(model[i].lsJustification){
                    for(let j = 0; j < model[i].lsJustification.length; j++){
                    
                        if(model[i].lsJustification[j].base64File != undefined){	// Obteniendo los archivos de justificacion
                            
                            jsFile = new Object();
                            jsFile.docInvId = DocInvBeanHeaderSAP.docInvId;					
                            jsFile.jsCount = model[i].lsJustification[j].jsCount;
                            jsFile.fileName = model[i].lsJustification[j].fileName;
                            jsFile.base64 = model[i].lsJustification[j].base64File;
                            model[i].lsJustification[j].base64File = null;
                            arrFiles.push(jsFile);
                        }
                    }
                }
                
            }
            
            DocInvBeanHeaderSAP.isTransitEnabled = !(this.byId("tbNoTransit").getPressed());
            DocInvBeanHeaderSAP.docInvPosition = model;
            DocInvBeanHeaderSAP.status = null;

            const request = {
                tokenObject: null,
                lsObject: DocInvBeanHeaderSAP
            };

            const json = await this.execService(InveServices.SAVE_CONCILIATION,request,"closeDocumment",this.showLog);
              
            if(json){
                let modelData;
                let oTable;
                if(this.byId("chkWerks").getState()){
                    oTable = this.byId("oTable");
                    model = "oModel";
                    modelData = oTable.getModel(model).getData();
                }else{
                    oTable = this.byId("oTableByLgpla");
                    model = "oModelLgpla";
                    modelData = this.byId("oTableByLgpla").getModel("oModelLgpla").getData();
                }
                
                this.byId('chkWerks').setEnabled(false);
                this.byId('chkLgpla').setEnabled(false);
                
                this.byId("createdBy").setValue(json.lsObject.createdBy);
                
               
                
                
                //Upload the files
                let status = this.uploadFiles(arrFiles, json.lsObject.docInvPosition); // Despues del guardado exitoso de la conicliacion... 
                                                                                            //... entonces se guardan los archivos
                if(status){//Upload Ok
                    
                    this.saveExplByWerks();
                    this.saveExplByLgpla();

                    
                    // Disable table model
                    for (let i = 0; i < modelData.length; i++) {

                            modelData[i].isOpen = false;
                            if(this.lastJustifyTab=="tabC"){
                                this.quantity[i].isOpen = false;
                                this.money[i].isOpen = false;
                            }else if(this.lastJustifyTab=="tabCByLgpla"){
                                this.quantityLgpla[i].isOpen = false;
                            }
                            
                    }

                    oTable.getModel(model).refresh();
                    this.byId("bCount").setEnabled(false);
                    this.byId("bSave").setEnabled(false);
                    this.byId("bUpload").setEnabled(false);	
                    this.byId("bPartialSave").setEnabled(false);
                    this.setOnEdit(false);
                    this.currentRecordRow.status = true;
                    let message = 'El Documento de Inventario se cerró de forma exitosa.';
                    this.byId('tbNoTransit').setEnabled(false);
                    this.byId("btn_Report_PDF").setEnabled(true);
                    this.byId("btn_Report_LGPLA_PDF").setEnabled(true);
                    this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pConciliation"));

                    setTimeout(function() {
                        
                        this.byId("messagesBox").getItems()[0].close();
                        
                    }.bind(this),3000);
                                                
                }else{
                    
                    let message = 'Ocurrió un problema mientras se guardaban los archivos justificados.';
                    this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pConciliation"));
                }	
                BusyIndicator.hide();
            }
    
        },
        
        saveChanges: async function(){// Guardado parcial
            
            if(this.validateConciType()){
                MessageBox.show('Debe de elegir un tipo de conciliación',
                                MessageBox.Icon.WARNING,"Falta información");
                
                return;
            }
            
            
            
            let model;
            let DocInvBeanHeaderSAP = new Object();
            if(this.byId("chkWerks").getState()){
                
                DocInvBeanHeaderSAP.docInvId = this.byId("docInvId").getValue();
                DocInvBeanHeaderSAP.conciType = "werks";

                //Asegurar que al guardar sea SIN la vista financiera activada, para no afectar el dashboard con caracteres $
                let state = this.byId("tbSH").getPressed();
                if(!state){
                    this.showFinan();
                }

                
                try {
                    model = this.copyObjToNew(this.quantity);
                } catch (e) {
                    model = [];
                }
                
            }else if(this.byId('chkLgpla').getState()){
                
                DocInvBeanHeaderSAP.docInvId = this.byId("docInvIdByLgpla").getValue();
                DocInvBeanHeaderSAP.conciType = "lgpla";

                 //Asegurar que al guardar sea SIN la vista financiera activada, para no afectar el dashboard con caracteres $
                 let state = this.byId("tbSHByLgpla").getPressed();
                 if(!state){
                     this.showFinan();
                 }

                
                try {
                    model = this.copyObjToNew(this.quantityLgpla);
                    this.cleanFormatLgpla(model);
                } catch (e) {
                    model = [];
                }

            }
            
            this.currentDocInvId = DocInvBeanHeaderSAP.docInvId;
           /*  console.log("DocInvBeanHeaderSAP.conciType",DocInvBeanHeaderSAP.conciType);
            console.log("model",model); */
        
            //Get the files
            let arrFiles = [];
            let jsFile;
            
            for(let i = 0; i < model.length; i ++){
                if(model[i].lsJustification){
                    for(let j = 0; j < model[i].lsJustification.length; j++){
                    
                        if(model[i].lsJustification[j].base64File != undefined){
                            
                            jsFile = new Object();
                            jsFile.docInvId = DocInvBeanHeaderSAP.docInvId;					
                            jsFile.jsCount = model[i].lsJustification[j].jsCount;
                            jsFile.fileName = model[i].lsJustification[j].fileName;
                            jsFile.base64 = model[i].lsJustification[j].base64File;
                            model[i].lsJustification[j].base64File = null;
                            arrFiles.push(jsFile);
                        }
                    }
                }
                
            }
            
            DocInvBeanHeaderSAP.docInvPosition = model;
            DocInvBeanHeaderSAP.status =  "0";
            //console.log("Al guardar DocInvBeanHeaderSAP",DocInvBeanHeaderSAP);

            const request = {
                tokenObject: null,
                lsObject: DocInvBeanHeaderSAP
            };

            const json = await this.execService(InveServices.SAVE_CONCILIATION,request,"saveChanges",this.showLog);
              
            if(json){
                console.log("Guardado exitoso de saveConciliation");																	
                //Desactilet los checks de conciliacion
                this.byId('chkWerks').setEnabled(false);
                this.byId('chkLgpla').setEnabled(false);
                
                this.byId("createdBy").setValue(json.lsObject.createdBy);
                
                //Upload the files
                let status = this.uploadFiles(arrFiles, json.lsObject.docInvPosition);
                
                if(status){//Upload Ok
                    
                    this.saveExplByWerks();
                    this.saveExplByLgpla();

                    
                    this.byId("bCount").setEnabled(true);
                    this.byId("bSave").setEnabled(true);
                    this.byId("bUpload").setEnabled(true);	
                    this.byId("bPartialSave").setEnabled(true);

                    this.currentRecordRow.status = true;
                    let message = 'Cambios guardados exitosamente.';
                    console.log("Guardado exitoso "+message);
                    console.log("Tab Activo "+this.currentActiveTab);
                    
                    this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pConciliation"));

                    setTimeout(function() {
                        this.byId("messagesBox").getItems()[0].close();
                    }.bind(this),3000);
                                                
                }else{
                    
                    let message = 'Ocurrió un problema mientras se realizaba el guardado parcial de archivos justificados';
                    this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pConciliation"));
                }	
                BusyIndicator.hide();    
            }
    
        },
        
        uploadFiles: async function(arrfiles, docInvPosition){
                    
            let found; 
            for(let i = 0; i < arrfiles.length; i++){
                
                found = false
                
                for(let j = 0; j < docInvPosition.length && !found; j++){
                                    
                    for(let k = 0; k < docInvPosition[j].lsJustification.length && !found; k++){
                                                                
                        if(arrfiles[i].jsCount == docInvPosition[j].lsJustification[k].jsCount){
                            
                            found = true;
                            arrfiles[i].jsId =  docInvPosition[j].lsJustification[k].jsId;						
                        }
                    }
                }			
            }		
            
            //Upload File to file
            let status;
            
            for(let i = 0; i < arrfiles.length && status; i++){
    
              status = await  this.execUploadFiles(arrfiles[i]);
    
            }
            
            
            return status;		
        },

        execUploadFiles: async function(lsObject){
            const request = {
                tokenObject: null,
                lsObject: lsObject
            };

            const json = await this.execService(InveServices.UPLOAD_FILE,request,"uploadFile",this.showLog);
              
            if(json){
                BusyIndicator.hide();
                return true;
            }
        },
    
        downloadTemplate : function() {
    
            let link = document.createElement("a");
            link.href = InveTemplates.JUSTIFICATIONS;
            link.click();
        },
    
        openFilePicker : function() {
    
            $('#fileConcSap').click();
        },
    
        uploadTemplate : function() {
            let message;
            this.eraseNotification();
            if(this.validateConciType()){
                $('#fileConcSap').val("");
                MessageBox.show('Debe de elegir un tipo de conciliación para poder justificar',
                                    MessageBox.Icon.WARNING,"Falta información");
                
                return;
            }
            let file = $('#fileConcSap').prop('files')[0];
            let allowedFiles = [ 'csv' ];
            let ext = file.name.split('.').pop().toLowerCase();
            let that = this;
            
            // Check if is an allowed file
            if (allowedFiles.indexOf(ext) == -1) {
                this.toast("Tipo de archivo no permitido, "
                        + "solo se permiten archivos de tipo: "
                        + allowedFiles, '20em');
                $('#fileConcSap').val("");
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
    
                if (allTextLines[size - 1].indexOf(",") == -1) {
                    allTextLines.splice(-1);
                }
    
               
    
                BusyIndicator.show();
    
                for (let i = 1; i < allTextLines.length; i++) {
    
                    data = allTextLines[i].split(',');
                    
                    if (isNaN(data[0])) {
    
                        BusyIndicator.hide();
                        message = 'Dato no válido para "Material" en la linea: ' + (i + 1);
                        that.message(message, MessageType.Error,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pConciliation"));
    
                        return;
                    }
    
                    if (isNaN(data[1])) {
                        
                        BusyIndicator.hide();
                        message = 'Dato no válido para "Cantidad" en la linea: ' + (i + 1);
                        that.message(message, MessageType.Error,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pConciliation"));
    
                        return;
                    }
    
                    if (isNaN(data[2])) {
    
                        BusyIndicator.hide();
                        message = 'Dato no válido para "Justificación Id" en la linea: ' + (i + 1);
                        that.message(message, MessageType.Error,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pConciliation"));
                        
                        return;
                    }
    
                    let found = false;
                    let justify;
    
                    for (let j = 0; j < that.lsJustifies.length; j++) {
    
                        if (that.lsJustifies[j].jsId == data[2]) {
    
                            justify = data[2] + ' - ' + that.lsJustifies[j].justification;
                            found = true;
                            break;
                        }
                    }
    
                    if (!found) {
    
                        BusyIndicator.hide();
                        message = '"Justificación Id" no válido en la linea: '	+ (i + 1);
                        that.message(message, MessageType.Error,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pConciliation"));
    
                        return;
                    }
    
                    let object = new Object();
                    object.item = data[0].trim();
                    object.quantity = data[1].trim();
                    object.jsId = data[2].trim();
                    try {
                        object.jsDescription = data[3];
                    } catch (e) {
                        console.warn("No description for material: " + data[0]);
                    }				 
                    object.justify = justify;
    
                    let objectID = -1;
                    for(; objectID < that.quantity.length; objectID++){
                        if(that.quantity[objectID]!=undefined){
                            if(that.quantity[objectID].matnr == data[0]){
                                break;
                            }
                        }
                    }
                    
                    if(objectID != -1 && that.quantity[objectID] != undefined){
                        let lsJustification;
        
                        if (that.quantity[objectID].lsJustification == undefined) {
                            
                            lsJustification = [];
                            lsJustification.push(object);
                            that.quantity[objectID].lsJustification = lsJustification;
                            that.money[objectID].lsJustification = lsJustification;
                            
                        } else {
                            
                            that.quantity[objectID].lsJustification.push(object);
                            that.money[objectID].lsJustification.push(object);
                        }
                    } else {
                        console.warn('"Material" no encontrado para justificacion: ' + data[0]);
                    }
    
                }
    
                // Update the models
                for (let i = 0; i < that.quantity.length; i++) {
    
                    let sumQuantityUMB = 0;
                    
                    // Get the quantity per justification
                    for (let j = 0; j < that.quantity[i].lsJustification.length; j++) {
    
                        sumQuantityUMB += parseFloat(that.quantity[i].lsJustification[j].quantity.replace(/,/g, ""));
                    }
    
                    // Update the quantity model
                    let counted = that.quantity[i].countedTot.replace(/,/g, "");
                    let accountant = that.quantity[i].accountant.replace(/,/g, "");
                    that.quantity[i].diff = new Intl.NumberFormat("en-US", {minimumFractionDigits : '2'
                                            }).format((sumQuantityUMB + parseFloat(counted))- parseFloat(accountant));
                    
                    if (that.quantity[i].diff.replace(/,/g, "") == 0){
                        that.quantity[i].isc = false;
                    }
    
                    // Update the money model
                    accountant = that.money[i].accountant.replace(/,/g, "").replace(/\$/g, "");
                    that.money[i].diff = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits : '2'
                                            }).format((parseFloat(sumQuantityUMB) + parseFloat(counted) - parseFloat(accountant))
                                                            * parseFloat(that.money[i].costByUnit));
                    
                }
    
                let oModel;
                let oTable = that.byId('oTable');
                let flg = that.byId("tbSH").getPressed();
    
                if (!flg) {
                    oModel = new JSONModel(that.quantity);			
                } else {
                    oModel = new JSONModel(that.money);	
                }
    
                oTable.setModel(oModel,"oModel");
    
                message = 'Carga concluida con éxito.';
                that.message(message, MessageType.Success,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pConciliation"));
    
                setTimeout(function() {
                    that.byId("messagesBox").getItems()[0].close();
                },5000);
    
                BusyIndicator.hide();
    
            }
    
            function errorHandler(evt) {
    
                if (evt.target.error.name == "NotReadableError") {
                    
                        MessageBox.show('No se puede leer el archivo.',MessageBox.Icon.ERROR, "Error");
                }
    
            }
    
            $('#fileConcSap').val("");
        },
    
        showMCDocInv : function(evt) {
    
            this.eraseNotification();
            let oView = this.getView();
            if (!this.byId("ODialogvMCDocInv")) {
      
                Fragment.load({
                    id: oView.getId(),
                    name: "com.bmore.inveweb.view.fragments.vMCDocInv",
                    controller: this
                  }).then(function(oDialog){
                    oView.addDependent(oDialog);
                    this.cleanOdialogvMCDocInv();
                    oDialog.open();
                  }.bind(this));
            }else{
                this.cleanOdialogvMCDocInv();  
                this.byId("ODialogvMCDocInv").open();
            }
            
        },
        loadDocInvDialogDocInv: async function(oEvent){
		
            if(oEvent != undefined){
                let clear = oEvent.getParameters().clearButtonPressed;
                
                if(clear){
                    this.cleanOdialogvMCDocInv();
                    return;
                }
            }
                    
            let oModel = new JSONModel([]);			
            let oTable = this.frgById("oTableDialogDocInv");	
            oTable.setModel(oModel,"oModel");
            
            let search = this.frgById("fSearchDialogDocInv").getValue();
            
            if(search.trim().length > 0 && isNaN(search)){
                MessageBox.show('El formato del Id es inválido.',MessageBox.Icon.ERROR, "Error");
                return;
            }		
            BusyIndicator.show(0);
            let bukrs = null;
            let werks = null;
                    
            if(!this.ADMIN_ROLE){
                
                bukrs = this.getBukrs();
                werks = this.getWerks();
            }
            
            let docInvBean = new Object();
            docInvBean.bukrs = bukrs;
            docInvBean.werks = werks;
            docInvBean.docInvId = (search.trim().length == 0? null: search); 	
    
            const request = {
                tokenObject: null,
                lsObject: docInvBean
            };
    
            const json = await this.execService(InveServices.GET_CLOSED_CONCILIATIONS_ID,request,"loadDocInv",this.showLog);
                if(json){
                    for(let i=0; i< json.lsObject.length; i++){
                        json.lsObject[i].idAux = parseInt(json.lsObject[i].id);
                    }
                    //Create a model and bind the table rows to this model           		            		
                    oTable.setModel(new JSONModel(json.lsObject), "oModel");
                    oTable.setGrowingThreshold(json.lsObject.length);        
                    BusyIndicator.hide();
                }
    
        },
        selectDocument: function(oEvent){
            let docId = sap.ui.getCore().byId(oEvent.getParameters().id).getCells()[0].getText();
            let modelData = this.frgById("oTableDialogDocInv").getModel("oModel").getData();
            let row;
            for(let i in modelData){
                if(docId == modelData[i].id){
                    row = modelData[i];
                    break;
                }
            }
            
            if(!row.available){
                MessageBox.warning('Extrayendo información de SAP, intente más tarde.',
                        MessageBox.Icon.WARNING, "Warning");
                this.loadDocInvDialogDocInv();
                return;
            }
            BusyIndicator.show(0);
            this.currentRecordRow = row;
            this.loadDocInfo(row);
        },
        loadDocInfo: async function(row){
		
            this.row = row;	
            console.log("[loadDocInfo] this.row",this.row);
            let bukrs = null;
            let werks = null;
                    
            if(!this.ADMIN_ROLE){
                
                bukrs = this.getBukrs();
                werks = this.getWerks();
            }
            
            let docInvBean = new Object();
            docInvBean.bukrs = bukrs;
            docInvBean.werks = werks;		
            docInvBean.docInvId = row.id;
            docInvBean.status = row.status;
            
            this.backupObjectDocBean = docInvBean;
            
            const request = {
                tokenObject: null,
                lsObject: docInvBean
            };
    
            const json = await this.execService(InveServices.GET_REPORTE_DOCINV_SAP_BY_WERKS,request,"loadDocInfo",this.showLog);
                if(json){
                    // Limpiando los checks de conciliacion elegida para cargar el nuevo documento
                    this.byId('chkWerks').setState(false); 
                    this.byId('chkLgpla').setState(false);
                    
                    this.werksEmpty = false;
                    this.byId("tbSH").setPressed(false);
                    
                    //Create a model and bind the table rows to this model
                    let row = json.lsObject;
                    console.log("[loadDocInfo] response el row",row);
                    let quantity = this.copyObjToNew(row.docInvPosition);
                    let money = this.copyObjToNew(row.docInvPosition);            		
                    let accountant;
                    
                    this.activeDocInvId = docInvBean.docInvId;//guardar el id del documento activo al momento
                    this.setSavedConciType(row.conciType); //Activa las justificaciones de la conciliacion seleccionada y desactiva las demas
                    
                    this.docInvRec = row;
                    
                    if(row.sapRecount){
                        
                        this.byId('matExpl').setEnabled(false);
                        
                    }else{
                        
                        this.byId('matExpl').setEnabled(true);
                    }
                    
                    if(this.row.status == true){
                        
                        this.byId('bCount').setEnabled(false); //The document is already closed
                        this.byId('bSave').setEnabled(false); //The document is already closed
                        this.byId('bUpload').setEnabled(false); //The document is already closed
                        this.byId('bPartialSave').setEnabled(false); //The document is already closed
                        
                        this.byId('btn_Report_PDF').setEnabled(true); //The document is already closed and can download pdf
                        this.byId('btn_Report_LGPLA_PDF').setEnabled(true);
                        
                        this.byId('chkWerks').setEnabled(false);
                        
                        if(row.transitEnabled){
                            this.byId('tbNoTransit').setPressed(false);
                            this.byId('idTransit').setVisible(false);
                        }else{
                            this.byId('tbNoTransit').setPressed(true);
                            this.byId('idTransit').setVisible(true); //The document is already closed
                        }
                        this.byId('tbNoTransit').setEnabled(false); //The document is already closed
                        this.byId('cISC').setVisible(false);
                        
                        for(let i = 0; i < quantity.length; i++){
                            
                            quantity[i].item = i + 1;
                            quantity[i].isc = false;
                            quantity[i].isOpen = false;
                            money[i].item = i + 1;
                            money[i].isc = false;
                            money[i].isOpen = false;
                                                                                                  
                            let theoric = quantity[i].theoric.replace(/,/g, "");
                            let consignation = quantity[i].consignation.replace(/,/g, "");
                            let transit = quantity[i].transit.replace(/,/g, "");
                            let costByUnit = parseFloat(quantity[i].costByUnit);
                            let counted = parseFloat(quantity[i].counted.replace(/,/g, ""));
                            let countedExpl = parseFloat(quantity[i].countedExpl.replace(/,/g, ""));
                            let totExpl = counted + countedExpl;
                            let difference = money[i].diff.replace(/,/g, "");
                                                        
                            accountant = parseFloat(theoric) + parseFloat(consignation) 
                                    + parseFloat(transit) + parseFloat(countedExpl);
                            
                            quantity[i].accountant = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(accountant);                		                		 
                                                                                                                                
                            quantity[i].countedAux = counted;    
                            quantity[i].countedExplAux = countedExpl;
                            quantity[i].countedTotAux = counted + countedExpl;
                            quantity[i].theoricAux = parseFloat(quantity[i].theoric.replace(/,/g, ""));
                            quantity[i].consignationAux = parseFloat(quantity[i].consignation.replace(/,/g, ""));
                            quantity[i].transitAux = parseFloat(quantity[i].transit.replace(/,/g, ""));
                            quantity[i].accountantAux = parseFloat(accountant);
                            quantity[i].diffAux = parseFloat(quantity[i].diff.replace(/,/g, ""));
                                    
                            this.backUpDiffWerks.push(quantity[i].diff); //por si cancelan justificacion
                            
                            quantity[i].countedTot = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(totExpl);
                            
                            quantity[i].countedExpl =  new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(parseFloat(countedExpl));
                            quantity[i].diff =  new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(parseFloat(quantity[i].diff.replace(/,/g, "")));
                            
                            //Format for money
                            money[i].theoric = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(parseFloat(theoric) * costByUnit);
                            
                            money[i].theoricAux = parseFloat(theoric) * costByUnit;
                            
                            money[i].consignation = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(consignation * costByUnit);
                            
                            money[i].consignationAux = consignation * costByUnit;
                            
                            money[i].transit = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(transit * costByUnit);
                            
                            money[i].transitAux = transit * costByUnit;
                            
                            money[i].accountant = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(accountant * costByUnit);
                            
                            money[i].accountantAux = accountant * costByUnit;
                            
                            money[i].diff = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(parseFloat(difference * costByUnit ));
                            
                            money[i].diffAux = parseFloat(difference * costByUnit );
                                                        
                            money[i].counted = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(counted * costByUnit);
                            
                            money[i].countedAux = counted * costByUnit;
                            
                            money[i].countedExpl = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(countedExpl * costByUnit);
                            
                            money[i].countedExplAux = countedExpl * costByUnit;
                            
                            money[i].countedTot = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(totExpl * costByUnit);
                            
                            money[i].countedTotAux = totExpl * costByUnit;
                            
                        }
                                                
                    }else if (this.row.partialSaved == true){
                        console.log("partial");
                        this.byId('bCount').setEnabled(true); //The document partial saved
                        this.byId('bSave').setEnabled(true); //The document partial saved
                        this.byId('bUpload').setEnabled(true); //The document partial saved
                        this.byId('bPartialSave').setEnabled(true);//The document partial saved
                        this.byId('chkWerks').setEnabled(false);// already defined conci
                        this.byId('cISC').setVisible(true);
    
                        this.byId('btn_Report_PDF').setEnabled(false); //The document partial saved and cannot download pdf
                        this.byId('btn_Report_LGPLA_PDF').setEnabled(false);
                        
                        for(let i = 0; i < quantity.length; i++){
                            
                            //Set the category to - if empty
                            if(quantity[i].category.length == 0){
                                
                                quantity[i].category = "-";
                                money[i].category = "-";
                            }
                            
                            quantity[i].item = i + 1;
                            money[i].item = i + 1;
                            
                            let theoric = quantity[i].theoric.replace(/,/g, "");
                            let consignation = quantity[i].consignation.replace(/,/g, "");
                            let transit = quantity[i].transit.replace(/,/g, "");
                            let costByUnit = parseFloat(quantity[i].costByUnit);
                            let counted = parseFloat(quantity[i].counted.replace(/,/g, ""));
                            let countedExpl = parseFloat(quantity[i].countedExpl.replace(/,/g, ""));
                            let totExpl = counted + countedExpl;
                            let difference = money[i].diff.replace(/,/g, "");
                            
                            let diff = parseFloat(quantity[i].diff.replace(/,/g, ""));
                                                        
                            accountant = parseFloat(theoric) + parseFloat(consignation) 
                                    + parseFloat(transit);// + parseFloat(countedExpl);
                            
                            if(diff != 0){
                                quantity[i].isc = true;
                            }else{
                                quantity[i].isc = false;
                            }
                            quantity[i].accountant = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(accountant);                		                		 
                            
                            quantity[i].countedAux = counted;    
                            quantity[i].countedExplAux = countedExpl;
                            quantity[i].countedTotAux = counted + countedExpl;
                            quantity[i].theoricAux = parseFloat(quantity[i].theoric.replace(/,/g, ""));
                            quantity[i].consignationAux = parseFloat(quantity[i].consignation.replace(/,/g, ""));
                            quantity[i].transitAux = parseFloat(quantity[i].transit.replace(/,/g, ""));
                            quantity[i].accountantAux = parseFloat(accountant);
                            quantity[i].diffAux = parseFloat(quantity[i].diff.replace(/,/g, ""));
                                                        
                            quantity[i].countedTot = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(totExpl);
                            
                            quantity[i].countedExpl = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(countedExpl); 
                            
                            quantity[i].diff = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(diff);
                            
                            this.backUpDiffWerks.push(quantity[i].diff); //por si cancelan justificacion
                            
                            //Format for money
                            money[i].theoric = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(parseFloat(theoric) * costByUnit);
                            
                            money[i].theoricAux = parseFloat(theoric) * costByUnit;
                            
                            money[i].consignation = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(consignation * costByUnit);
                            
                            money[i].consignationAux = consignation * costByUnit;
                            
                            money[i].transit = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(transit * costByUnit);
                            
                            money[i].transitAux = transit * costByUnit;
                            
                            money[i].accountant = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(accountant * costByUnit);
                            
                            money[i].accountantAux = accountant * costByUnit;
                            
                            money[i].diff = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(parseFloat(difference * costByUnit ));
                            
                            money[i].diffAux = parseFloat(difference * costByUnit );
                                                        
                            money[i].counted = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(counted * costByUnit);
                            
                            money[i].countedAux = counted * costByUnit;
                            
                            money[i].countedExpl = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(countedExpl * costByUnit);
                            
                            money[i].countedExplAux = countedExpl * costByUnit;
                            
                            money[i].countedTot = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                            .format(totExpl * costByUnit);
                            
                            money[i].countedTotAux = totExpl * costByUnit;
                            
                        }
                        
                    }else{
                        
                        this.byId('bCount').setEnabled(true); //The document still is open
                        this.byId('bSave').setEnabled(true); //The document still is open
                        this.byId('bUpload').setEnabled(true); //The document still is open
                        this.byId('bPartialSave').setEnabled(true);//The document still is open
                        this.byId('chkWerks').setEnabled(true);//not selected conci
                        this.byId('cISC').setVisible(true);
                        this.byId('btn_Report_PDF').setEnabled(false);//The document still is open and cannot download pdf
                        this.byId('btn_Report_LGPLA_PDF').setEnabled(false);
                        
                        try {
                                                        
                            for(let i = 0; i < quantity.length; i++){
                                
                                //Set the category to - if empty
                                if(quantity[i].category.length == 0){
                                    
                                    quantity[i].category = "-";
                                    money[i].category = "-";
                                }
                                
                                quantity[i].item = i + 1;
                                money[i].item = i + 1;
                                                                
                                accountant = parseFloat(quantity[i].theoric) + parseFloat(quantity[i].consignation) 
                                        + parseFloat(quantity[i].transit);
                                
                                let diff =  parseFloat(quantity[i].counted) + parseFloat(quantity[i].countedExpl) - accountant
                                                                
                                if(diff != 0){
                                    quantity[i].isc = true;
                                }else{
                                    quantity[i].isc = false;
                                }
                                
                                if(quantity[i].theoric == undefined){
                                    quantity[i].theoric = 0;
                                }
                                
                                quantity[i].theoricAux = parseFloat(quantity[i].theoric)
                                
                                quantity[i].theoric = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(quantity[i].theoric);
                                                                                                
                                quantity[i].consignation = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(quantity[i].consignation);
                                
                                quantity[i].consignationAux = parseFloat(quantity[i].consignation);
                                                                
                                quantity[i].transit = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(quantity[i].transit);
                                
                                quantity[i].transitAux = parseFloat(quantity[i].transit);
                                                                                                
                                quantity[i].accountant = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(accountant);
                                
                                quantity[i].accountantAux = parseFloat(accountant);
                                
                                quantity[i].diff = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(parseFloat(quantity[i].counted) + parseFloat(quantity[i].countedExpl) - accountant);
                                                                
                                quantity[i].diffAux = diff;
                                                                
                                quantity[i].countedAux = parseFloat(quantity[i].counted);
                                
                                quantity[i].countedTot = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(parseFloat(quantity[i].counted) + parseFloat(quantity[i].countedExpl));
                                
                                quantity[i].counted = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(quantity[i].counted);
                                
                                quantity[i].countedExplAux = parseFloat(quantity[i].countedExpl);
                                
                                quantity[i].countedExpl = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(quantity[i].countedExpl); 
                                
                                this.backUpDiffWerks.push(quantity[i].diff); //por si cancelan justificacion
                                
                                //Calculate the money view                				
                                let theoric = quantity[i].theoric.replace(/,/g, "");
                                let consignation = quantity[i].consignation.replace(/,/g, "");
                                let transit = quantity[i].transit.replace(/,/g, "");
                                let counted = quantity[i].counted.replace(/,/g, "");
                                let countedExpl = quantity[i].countedExpl.replace(/,/g, "");
                                let difference = quantity[i].diff.replace(/,/g, "");
                                                                                                
                                accountant *= money[i].costByUnit;
                                
                                money[i].theoric = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(theoric * money[i].costByUnit);
                                
                                money[i].theoricAux = parseFloat(theoric * money[i].costByUnit);
                                
                                money[i].consignation = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(consignation * money[i].costByUnit);
                                
                                money[i].consignationAux = parseFloat(consignation * money[i].costByUnit);
                                
                                money[i].transit = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(transit * money[i].costByUnit);
                                
                                money[i].transitAux = parseFloat(transit * money[i].costByUnit);
                                
                                money[i].accountant = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(accountant);
                                
                                money[i].accountantAux = parseFloat(accountant);
                                
                                money[i].diff = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(difference * money[i].costByUnit);
                                
                                money[i].diffAux = parseFloat(diff * parseFloat(money[i].costByUnit));
                                                                                                
                                money[i].counted = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(counted * money[i].costByUnit);   
                                
                                money[i].countedAux = parseFloat(counted * money[i].costByUnit);
                                
                                money[i].countedExpl = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format(countedExpl * money[i].costByUnit);   
                                
                                money[i].countedExplAux = parseFloat(countedExpl * money[i].costByUnit);
                                
                                money[i].countedTot = "$" + new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'})
                                .format((parseFloat(counted) + parseFloat(countedExpl)) * money[i].costByUnit);
                                
                                money[i].countedTotAux = (parseFloat(counted) + parseFloat(countedExpl)) * money[i].costByUnit;
                                                                
                            }
                                                        
                        } catch (e) {
                            console.error(e);    						    						
                        }    					    					    					
                    }
                    
                    //The initial model for table on quantity
                    this.quantity = quantity;
                    
                    //The initial model for table on money
                    this.money = money;
                                        
                    try {
                        this.byId('docInvId').setValue(row.docInvId);
                    } catch (e) {
                        console.warn(e);
                    }
                    
                    try {
                        this.byId('bukrs').setValue(row.bukrs + " - " + row.bukrsD);
                    } catch (e) {
                        console.warn(e);
                    }
                    
                    try {
                        this.byId('werks').setValue(row.werks + " - " + row.werksD);
                    } catch (e) {
                        console.warn(e);
                    }
                    
                    try {
                        this.byId('dStart').setValue(row.creationDate);
                    } catch (e) {
                        console.warn(e);
                    }
                    
                    try {
                        this.byId('dEnd').setValue(row.conciliationDate);
                    } catch (e) {
                        console.warn(e);
                    }
                    
                    try {
                        this.byId('routeId').setValue(row.route);
                    } catch (e) {
                        console.warn(e);
                    }
                    
                    try {
                        
                        if(row.type == 1){
                            this.byId('type').setValue("Diario");
                        }else{
                            this.byId('type').setValue("Mensual");
                        }
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
                                        
                    try {
                                                
                        let oModelPotisions = new JSONModel(quantity);
                        
                        let oTable = this.byId("oTable");
                        oTable.setModel(oModelPotisions,"oModel");
                                                                                    
                    } catch (e) {
                        console.warn(e);
                    }
                    
                    //Clean the expl view 
                    this.cleanViewvMatExpl();
                    
                    //Clean the explosion table
                    try {
                        
                        let oTable = this.byId('oTableExplRep');
                        oTable.setModel(new JSONModel([]),"oModelExplRep");
                                                                                    
                    } catch (e) {
                        console.warn(e);
                    }
                    
                    if(this.byId("ODialogvMCDocInv")){
                        this._dialogvMCDocInvClose();
                    }
                    BusyIndicator.hide();
                }
        },
        cleanOdialogvMCDocInv: function(){
		
            let fSearch = this.frgById("fSearchDialogDocInv");
            fSearch.setValue("");
            let oModel = new JSONModel([]);
            oModel.setData({});				
            let oTable = this.frgById("oTableDialogDocInv");	
            oTable.setModel(oModel,"oModel");
        },
        _dialogvMCDocInvClose:function(){
            this.byId("ODialogvMCDocInv").close();
        },
    
        loadVJustify : function(oEvent) {
    
           
            let item = sap.ui.getCore().byId(oEvent.getParameters().id).getCells()[0].getText();
            let modelData = this.byId("oTable").getModel("oModel").getData();
            let row;
            for(let i in modelData){
                if(item == modelData[i].item){
                    row = modelData[i];
                    break;
                }
            }
            this.eraseNotification();
            this.rowJustify = row;
            this.navTo("vJustify");
           
        },
    
        showFinan : function() {
            
            let state = this.byId("tbSH").getPressed();
            let oModelPotisions;  
        
            if (!state) {
                oModelPotisions = new JSONModel(this.quantity);
                this.byId("cISC").setVisible(true);
                this.byId("btn_Report_PDF").setText("Reporte Conciliación");
                this.byId("btn_Report_PDF").setTooltip("Descargar Reporte Conciliado Pdf");
            } else {
                oModelPotisions = new JSONModel(this.money);
                this.byId("cISC").setVisible(false);			
                this.byId("btn_Report_PDF").setText("Reporte Conciliación Financiero");
                this.byId("btn_Report_PDF").setTooltip("Descargar Reporte Conciliado Financiero Pdf");
            }
    
            let oTable = this.byId("oTable");
            oTable.setModel(oModelPotisions,"oModel");
    
        },
    
        downloadAccountant : function() {
    
            let data = this.quantity;
            
            if (data.length == 0) {
                
                this.toast("Nada que exportar...", "20em");
                return;
            }
    
            let sumDif = 0;
            let totDif = 0;

            let itemsCounted = 0;
            let inventoryValue = 0;
            let percent1;
            let percent2;
            let countMatnr = 0;
            let zeroDiffMatnr = 0;
            let difPercWellCount = 0;
            
            for (let i = 0; i < data.length; i++) {
    
                sumDif += parseFloat(data[i].diff.replace(/,/g, ""));
                totDif += (parseFloat(data[i].diff.replace(/,/g, "")) * parseFloat(data[i].costByUnit));
                itemsCounted += parseFloat(data[i].counted.replace(/,/g, "")) + parseFloat(data[i].countedExpl.replace(/,/g, ""));
                inventoryValue += (parseFloat(data[i].accountant.replace(/,/g, "")) * parseFloat(data[i].costByUnit))
                
                countMatnr++;
                if(parseFloat(data[i].diff.replace(/,/g, "")) == 0){
                    zeroDiffMatnr++;
                }
            }
            
            percent1 = ((parseFloat(sumDif / itemsCounted) * 100).toFixed(3));
            
            if(percent1 > 100){
                percent1 = 100
            }else if(percent1 < -100){
                percent1 = -100
            }
            
            percent2 = ((parseFloat(totDif / inventoryValue) * 100).toFixed(3));
            
            if(percent2 > 100){
                percent2 = 100
            }else if(percent2 < -100){
                percent2 = -100
            }
            
            difPercWellCount = ((parseFloat(zeroDiffMatnr / countMatnr) * 100).toFixed(3));
            difPercWellCount = (isFinite(difPercWellCount) == false ? 0 : difPercWellCount);
    
            let report = "";		
            report += "Documento de Inventario:," + this.byId("docInvId").getValue();
            report += ",,,,Ítem Contados, Con Diferencia, Diferencia Porcentual" + "\r\n";
            report += "Sociedad:," + this.byId("bukrs").getValue();
            report += ",,,," + itemsCounted + "," + sumDif + "," + (isFinite(percent1) == false ? 0 : percent1) + "%\r\n";
            report += "Centro:," + this.byId("werks").getValue();
            report += ",,,,Valor Inventario en SAP, Valor Diferencia, Diferencia Porcentual" + "\r\n";
            report += "Fecha de Creación:," + this.byId("dStart").getValue();
            report += ",,,," + inventoryValue + "," + totDif + "," + (isFinite(percent2) == false ? 0 : percent2) + "%\r\n";
            report += "Fecha de Conciliación:," + this.byId("dEnd").getValue() + "\r\n";
    
            report += ",,,,SKU´s Contados, SKU´s Correctos, Diferencial Porcentual" + "\r\n";
            report += "Tipo de Documento:," + this.byId("type").getValue();
            report += ",,,"+ countMatnr + "," + zeroDiffMatnr + "," +difPercWellCount+ "%\r\n";
    
            report += "Tipo de Documento:," + this.byId("type").getValue() + "\r\n";
            report += "\r\n";
            report += "Categoría, Material, Descripción, U.M.B., Inventario Físico, Teórico, Contable Cantidad, Tránsito, Consignación, Diferencia en Cantidad en UMB, "
            report += "Precio Medio, Contable Valor, Diferencia en Valor en UMB, Justificación Cantidad, Justificación Valor, Justificación Porcentual, "
            report += "Diferencia Porcentual, "
            report += " Resumen \r\n "
    
            for (let i = 0; i < data.length; i++) {
    
                report += data[i].category.trim() + ","
                report += data[i].matnr + ","
                report += data[i].matnrD.replace(/,/g, "") + ","
                report += data[i].meins + ","
                let counted = parseFloat(data[i].counted.replace(/,/g, "")) + parseFloat(data[i].countedExpl.replace(/,/g, "")) 
                report += counted + "," // Inventario físico
                report += data[i].theoric.replace(/,/g, "") + ","
                let accountant = parseFloat(data[i].accountant.replace(/,/g, ""));
                report += accountant.toFixed(2) + ","
                report += data[i].transit.replace(/,/g, "") + ","
                report += data[i].consignation.replace(/,/g, "") + ","
                
                
                let constDiff = parseFloat(data[i].counted.replace(/,/g, "")) + parseFloat(data[i].countedExpl.replace(/,/g, "")) - accountant
                let difference = parseFloat(data[i].diff.replace(/,/g, ""));	
                let percentDiff = "";
                
                if(difference == 0 || constDiff == 0){
                    percentDiff = 0;
                }else{
                    percentDiff = ((difference / counted).toFixed(2) * 100);
                    percentDiff = (isFinite(percentDiff) == false ? 0 :  percentDiff);
                }
                
                if(percentDiff > 100){
                    percentDiff = 100
                }else if(percentDiff < -100){
                    percentDiff = -100
                }
                            
                
                report += difference + "," // Diferencia cantidad en umb
                report += "$" + data[i].costByUnit + "," //Precio Medio
                
                let costAccountant = (accountant * data[i].costByUnit).toFixed(2);
                report += "$" + costAccountant + ","
                report += "$" + difference * parseFloat(data[i].costByUnit) + ","; // diferencia en valor umb
    
                let totJsQuant = 0;
                let quant;
    
                let jsConcat = "";
                
                if(data[i].lsJustification){
                    for (let j = 0; j < data[i].lsJustification.length; j++) {
                        quant = data[i].lsJustification[j].quantity.replace(/,/g, "");
                        quant = parseFloat(quant)
                        totJsQuant += parseFloat(quant);
                        jsConcat += "(" + data[i].lsJustification[j].quantity.replace(/,/g, "") + " ; "
                        jsConcat += data[i].lsJustification[j].justify + "); ";				
                    }
                }
                
                
                report += totJsQuant + ","
                report += "$" + (totJsQuant * parseFloat(data[i].costByUnit))	+ ","
    
                constDiff = parseFloat(data[i].counted.replace(/,/g, "")) + parseFloat(data[i].countedExpl.replace(/,/g, "")) - accountant
                difference = parseFloat(data[i].diff.replace(/,/g, ""));	
                percentDiff = "";
                
                if(difference == 0 || constDiff == 0){
                    percentDiff = 0;
                }else{
                    percentDiff = ((difference / counted).toFixed(2) * 100);
                    percentDiff = (isFinite(percentDiff) == false ? 0 :  percentDiff);
                }
                
                if(percentDiff > 100){
                    percentDiff = 100
                }else if(percentDiff < -100){
                    percentDiff = -100
                }
                            
                let percentJs = "";
                
                if(totJsQuant == 0 || constDiff == 0){
                    percentJs = 0;				
                }else{				
                    percentJs = Math.abs((totJsQuant / constDiff).toFixed(2) * 100);
                }
                
                report += percentJs + "%,"			
    
    
                report += percentDiff + "%,";
    
                report += "Consignación: " + data[i].consignation.replace(/,/g, "") + " ; "
                report += "Tránsito: " + data[i].transit.replace(/,/g, "") + " ; "
                report += "Justificación: " + jsConcat + ",";
                report += "\r\n";
            }
    
            let textFileAsBlob = new Blob([ "\ufeff", report ], {
                type : 'text/plain;charset=ISO-8859-1',
                encoding : "ISO-8859-1"
            });
    
            let fileNameToSaveAs = "Conciliación_SAP_Centro_DocInv_" + this.byId("docInvId").getValue() + '.csv';
            let downloadLink = document.createElement("a");
            downloadLink.download = fileNameToSaveAs;
            
            if (window.webkitURL != null) {
                // Chrome allows the link to be clicked without
                // actually adding it to the DOM.
                downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
            } else {
                // Firefox requires the link to be added to the DOM
                // before it can be clicked.
                downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                downloadLink.onclick = destroyClickedElement;
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
            }
            
            downloadLink.click();
    
        },
    
        askRecount : function() {
    
            this.eraseNotification();
            let docInvRec;
            
            if(this.validateConciType()){
                MessageBox.show('Debe de elegir un tipo de conciliación para recontar',
                                                    MessageBox.Icon.WARNING,
                                                    "Falta información");
                
                return;
            }
            
            let modelData;
            
            if(this.byId("chkWerks").getState()){
                modelData = this.byId("oTable").getModel("oModel").getData();
                docInvRec = this.byId("docInvId").getValue();
            }else
            
            if(this.byId('chkLgpla').getState()){
                modelData = this.byId("oTableByLgpla").getModel("oModelLgpla").getData();
                docInvRec = this.byId("docInvIdByLgpla").getValue();
            }
            let positionsMarked = [];
    
            // Get the records marked
            for (let i in modelData) {
    
                if (modelData[i].isc == true) {
                    positionsMarked.push(modelData[i].matnr);
                }
            }
    
            if (positionsMarked.length == 0) {
    
                this.toast("Nada que recontar...", "20em");
                BusyIndicator.hide();
                return;
            }
            this.forRecountSAP_DocInvRec = docInvRec;
            this.forRecountSAP_ModelData = modelData;
            this.navTo("vRecountSap");	
            
        },
    
        loadDocInvInfo: async function(groupId) {
    
            this.eraseNotification();
            let modelData = this.byId("oTable").getModel("").getData();
            let positionsMarked = [];
    
            // Get the records marked
            let strMatnr = "";
            for (let i = 0; i < modelData.length; i++) {
    
                if (modelData[i].isc == true) {
                    positionsMarked.push(modelData[i].matnr);
                    
                    strMatnr = strMatnr.length < 1 ? modelData[i].matnr	+ "#"
                            + modelData[i].matnrD : strMatnr
                            + "|" + modelData[i].matnr
                            + "#" + modelData[i].matnrD;
                }
            }
            
            let docInvBean = new Object();
            docInvBean.route = null;
            docInvBean.bukrs = null;
            docInvBean.bukrsD = null;
            docInvBean.werks = null;
            docInvBean.werksD = null;
            docInvBean.type = null;
            docInvBean.status = null;
            docInvBean.createdBy = null;
            docInvBean.docInvId = this.docInvRec.docInvId;
    
            const request = {
                tokenObject: null,
                lsObject: docInvBean
            };

            const json = await this.execService(InveServices.GET_CONCILIATION,request,"getConciliation",this.showLog);
              
            if(json){
                this.docInv = json.lsObject;
                let positions = json.lsObject.positions;

                // Mark positions model, the matnr
                // to recount
                
                for (let i = 0; i < positionsMarked.length; i++) {

                    for (let j = 0; j < positions.length; j++) {

                        positions[j].isOpen = false;

                        if (positionsMarked[i] == positions[j].matnr) {

                                positions[j].isc = true;
                        }
                    }
                }

                this.addRecountSAPTask(groupId,	strMatnr);
                BusyIndicator.hide();
            }
        },
    
        addRecountSAPTask: async function(groupId, strMatnr) {
   
            let docBean = new Object();
            docBean.docInvId = null; // va null ya que no tiene que tener Doc Inv padre
            docBean.route = this.docInv.route;
            docBean.bukrs = this.docInv.bukrs;
            docBean.bukrsD = this.docInv.bukrsD;
            docBean.werks = this.docInv.werks;
            docBean.werksD = this.docInv.werksD;
            docBean.type = "1";			//se deja en 1 sin importar si es diario o mensual, para que se pueda contar con un solo grupo
            docBean.status = null;
            docBean.createdBy = null;
    
            let taskBean = new Object();
            taskBean.taskId = null;
            taskBean.groupId = groupId;
            taskBean.docInvId = docBean;
            taskBean.taskJSON = strMatnr;
            taskBean.dCreated = null;
            taskBean.dDownlad = null;
            taskBean.dUpload = null;
            taskBean.status = true;
            taskBean.rub = null;
            taskBean.recount = "S"; 

            const request = {
                tokenObject: null,
                lsObject: taskBean
            };

            const json = await this.execService(InveServices.GET_SPECIAL_SAP_COUNT,request,"addRecountSAPTask",this.showLog);
              
            if(json){
                
                BusyIndicator.hide();
                let taskId = json.lsObject.taskId;
                let docuI = json.lsObject.docInvId.docInvId;
                this.closeDocumment();

                setTimeout(function() {
                    this.message('Se generó la tarea para reconteo con Id: ' 
                            + taskId
                            + " en el documento de inventario: "
                            + docuI,
                            MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pConciliation"));
                },4000);
            }
    
            },
            
            saveExplByWerks: function(){
                let dataExplWerks;
                if(this.flagExplCentro){
                    dataExplWerks = /*vMatExpl this.oCtrl*/ this.getExplDataTable();
                    /*vMatExpl this.oCtrl*/ this.sendTable(dataExplWerks);
                    console.log("datos ya en tabla ExplWerks");
    
                }else{
                    
                    /*vMatExpl this.oCtrl*/ this.saveReportExplWerks();
    
                }
            },
            
            saveExplByLgpla: function(){
                
                let dataExplLgpla;
                if(this.flagExplLgpla){
                    dataExplLgpla = this.getExplDataTableMatExplByLgpla();
                    this.sendTableMatExplByLgpla(dataExplLgpla);
                    console.log("datos ya en tabla ExplLgpla");
    
                }else{
                    
                    this.saveReportExplLgpla();
    
                }
            },
            
        verifyConci: function(conci){
            console.log("Entrando verifyConci");
            if(this.lastJustifyTab != conci){
                if(this.lastJustifyTab != undefined){
                    let modelJustify = this.getJustifyModel(this.lastJustifyTab);
                    if(modelJustify != undefined){
    
                        MessageBox.confirm(
                                 "ADVERTENCIA! Se eliminarán los cambios para la justificacion por "+this.lastJustifyActive+" ¿Desea continuar?", {
                                      icon: MessageBox.Icon.WARNING,
                                      actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                                      onClose: function(oAction) { 
                                          
                                        if(oAction == 'NO'){
                                            console.log("Regresando a la conci con justificacion activa: ",this.lastJustifyTab);
                                            this.byId("tabBar").setSelectedKey(this.lastJustifyTab);
                                        }else{
                                            //Eliminar los datos del modeloJustify
                                            this.currentActiveTab = conci;
                                            this.preloadDoc(conci);
                                            this.clearJustifyModel(this.lastJustifyTab);
                                        } 			        	  			        	  
                                    }.bind(this)						
                                }
                            );
                    
                    }else{
                        console.log("modelJustify regreso undefined de getJustifyModel con this.lastJustifyTab:",this.lastJustifyTab);
                        this.preloadDoc(conci);
                        this.currentActiveTab = conci;
                    }
                }else{
                    console.log("this.lastJustifyTab es undefined", this.lastJustifyTab);
                    this.preloadDoc(conci);
                    this.currentActiveTab = conci;
                }
                
            }else{
                console.log("Tabs iguales this.lastJustifyTab", this.lastJustifyTab);
                console.log("Tabs iguales conci",conci);
            }
   
            
        },
        
        getJustifyModel: function(tab){
            
            switch(tab){
            
            
            case 'tabC':
    
                if(sap.ui.getCore().byId('container-inveweb---vJustify--oTable') != undefined && sap.ui.getCore().byId('container-inveweb---vJustify--oTable').getModel("oModelJustify").getData().length > 0){
                    return sap.ui.getCore().byId('vJustify--oTable').getModel("").getData();
                }else{
                    return undefined;
                }
                
            case 'tabCByLgpla':
    
                if(sap.ui.getCore().byId('vJustifyLgpla--oTable') != undefined && sap.ui.getCore().byId('vJustifyLgpla--oTable').getModel("oModelJustifyLgpla").getData().length > 0){
                    return sap.ui.getCore().byId('vJustifyLgpla--oTable').getModel("").getData();
                }else{
                    return undefined
                }
                
            default:
                
                console.log("Default de getJustifyModel", tab);
                break;	
            
            }
        },
        
        clearJustifyModel: function(tab){
            
            switch(tab){
            
            case 'tabC':
                console.log("Borrando ModelJustify tabC");
                this.jsCount = 0;
                sap.ui.getCore().byId('container-inveweb---vJustify').getController().dismissJustifies();
                this.resetDiff();
                
                break;
                
            case 'tabCByLgpla':
                console.log("Borrando ModelJustify tabCByLgpla");
                this.jsCount = 0;
                sap.ui.getCore().byId('vJustifyLgpla').getController().dismissJustifies();
                this.resetDiffLgpla();
                
                break;
                
            default:
                console.log("Algo anda mal tab:", tab);
                break;	
            
            }
        },
        
        resetDiff: function(){
            let oTableModelData = this.byId("oTable").getModel().getData("")
            let arrDiff = sap.ui.getCore().byId('container-inveweb---vConsSap').getController().backUpDiffWerks;
            
            if(oTableModelData.length > 0 && arrDiff.length > 0 && oTableModelData.length == arrDiff.length){
                
                for(let i in oTableModelData){
                    oTableModelData[i].diff = arrDiff[i];
                }
                this.byId("oTable").getModel("").refresh(true);
                console.log("Diferencias restauradas");
            }else{
                console.error("No coinciden los arreglos de oTableModelData y arrDiff", oTableModelData,arrDiff );
            }
            
        },
        
        preloadDoc: function(tabToGo){
            
            switch(tabToGo){
            
            case 'tabC':
                
                if((this.werksEmpty && !this.lgplaEmpty) || this.preloadInDifferentActiveDocId("tabC")){
                    
                    let oView = this.getView();
                    if (!this.byId("ODialogvMCDocInv")) {
            
                        Fragment.load({
                            id: oView.getId(),
                            name: "com.bmore.inveweb.view.fragments.vMCDocInv",
                            controller: this
                        }).then(function(oDialog){
                            oView.addDependent(oDialog);
                            this.cleanOdialogvMCDocInv();
                        }.bind(this));
                    }
                    
                    this.loadDocInfo(this.currentRecordRow);
                }
            
                break;
                
            case 'tabCByLgpla':
                
                if((this.lgplaEmpty && !this.werksEmpty) || this.preloadInDifferentActiveDocId("tabCByLgpla")){
                    this.loadDocLgplaInfo(this.currentRecordRow);
                }
    
                break;
                
            default:
                
                console.log("Defalut de funcion preloadDoc:", tabToGo);
                break;	
            
            }
        },
        
        preloadInDifferentActiveDocId: function(tabToGo){
            
            let docWerks = sap.ui.getCore().byId('container-inveweb---vConsSap--docInvId');
            let docLgpla = sap.ui.getCore().byId('container-inveweb---vConsSap--docInvIdByLgpla');
            if("tabC" == tabToGo){
                if(docWerks.getValue().length > 0 && this.activeDocInvId != undefined && docWerks.getValue() != this.activeDocInvId){
                    return true;
                }
            }else if("tabCByLgpla" == tabToGo){
                if(docLgpla.getValue().length > 0 && docLgpla.getValue() != this.activeDocInvId){
                    return true;
                }
            }
            
            return false;
            
        },
        
        cleanFormatLgpla: function(model){
            
            for(let i in model){
                model[i].costByUnit = model[i].costByUnit.replace(/,/g, "");
                model[i].counted     = model[i].counted.replace(/,/g, "");
                model[i].countedCost = model[i].countedCost.replace(/,/g, "").replace("$", "");
                model[i].countedExpl = model[i].countedExpl.replace(/,/g, "");
                model[i].countedTot  = model[i].countedTot.replace(/,/g, "");
                model[i].diff        = model[i].diff.replace(/,/g, "");
                model[i].diffCost    = model[i].diffCost.replace(/,/g, "").replace("$", "");
                model[i].theoric     = model[i].theoric.replace(/,/g, "");
                model[i].theoricCost = model[i].theoricCost.replace(/,/g, "").replace("$", "");
            }
    
            
        },
        
        checkConci: function(){
            if(this.byId("chkWerks").getState()){
                console.log("conci por centro activa");
                sap.ui.getCore().byId('container-inveweb---vConsSap--chkLgpla').setState(false);
                this.setSavedConciType("werks");
            }else{
                this.setSavedConciType("");
            }
            
            
        },
        
        validateConciType: function(){
            
            if(this.byId("chkWerks").getState()){
                return false;
            }
            
            if(sap.ui.getCore().byId('container-inveweb---vConsSap--chkLgpla').getState()){
                return false;
            }
            
            return true;
        },
        
        setSavedConciType: function(conciType){
            if(conciType != undefined){
                if(conciType == "werks"){
                    sap.ui.getCore().byId('container-inveweb---vConsSap--chkWerks').setState(true);
                    sap.ui.getCore().byId('container-inveweb---vConsSap--chkLgpla').setState(false);
                    
                    this.conciTypeMessage("Conciliación elegida: Centro", MessageType.Information);
                    
                    this.lockButtonJWerks = false; 
                    this.lockButtonJLgpla = true; 
                    
                }else if(conciType == "lgpla"){
                    sap.ui.getCore().byId('container-inveweb---vConsSap--chkWerks').setState(false);
                    sap.ui.getCore().byId('container-inveweb---vConsSap--chkLgpla').setState(true);
                    
                    this.conciTypeMessage("Conciliación elegida: Ubicación", MessageType.Information);
                    
                    this.lockButtonJWerks = true; 
                    this.lockButtonJLgpla = false; 
                    
                }else{
                    this.conciTypeMessage("Debe elegir un tipo de conciliación para poder justificar", MessageType.Warning);
                }
                
            }else{
                this.conciTypeMessage("Debe elegir un tipo de conciliación para poder justificar", MessageType.Warning);
            }
        },	
        
        removeTransit: function(){
            let state = this.byId("tbNoTransit").getPressed();
            if(this.byId('bSave').getEnabled() == false && !state){
                this.byId("tbNoTransit").setText("Transitos Activos");
                return;
            }else if(this.byId('bSave').getEnabled() == false && state){
                this.byId("tbNoTransit").setText("Sin Tránsitos");
            }
            let modelData = this.byId("oTable").getModel("oModel").getData();
            
            if(!state){
                this.byId("tbNoTransit").setText("Transitos Activos");
                for(let i in modelData){
                    let tr = parseFloat(modelData[i].transit.replace(/,/g,""));
                    if(tr != 0){
                        
                        modelData[i].accountant = parseFloat(modelData[i].accountant.replace(/,/g,"")) + parseFloat(modelData[i].transit.replace(/,/g,""));
                        let sumJsQuantity = 0
                        for(let j in modelData[i].lsJustification){
                            sumJsQuantity += parseFloat(modelData[i].lsJustification[j].quantity.replace(/,/g,""))
                        }
                        let coun = parseFloat(modelData[i].counted.replace(/,/g,""));
                        modelData[i].diff = (sumJsQuantity + coun) - (modelData[i].accountant);
                        if(modelData[i].diff == 0){
                            modelData[i].isc = false;
                        }else{
                            modelData[i].isc = true;
                        }
                        modelData[i].accountant = this.formatNumber(modelData[i].accountant);
                        modelData[i].diff = this.formatNumber(modelData[i].diff);
                    }
                    
                }
            }else{
                this.byId("tbNoTransit").setText("Sin Tránsitos");
                for(let i in modelData){
                    let tr = parseFloat(modelData[i].transit.replace(/,/g,""));
                    if(tr != 0){
                        let ac = parseFloat(modelData[i].accountant.replace(/,/g,""));
                        modelData[i].accountant = ac - tr;
                        let sumJsQuantity = 0
                        for(let j in modelData[i].lsJustification){
                            sumJsQuantity += parseFloat(modelData[i].lsJustification[j].quantity.replace(/,/g,""))
                        }
                        let coun = parseFloat(modelData[i].counted.replace(/,/g,""));
                        modelData[i].diff = (sumJsQuantity + coun) - (modelData[i].accountant);
                        if(modelData[i].diff == 0){
                            modelData[i].isc = false;
                        }else{
                            modelData[i].isc = true;
                        }
                        modelData[i].accountant = this.formatNumber(modelData[i].accountant);
                        modelData[i].diff = this.formatNumber(modelData[i].diff);
                    }
                    
                }
            }
            this.quantity = modelData;
            this.byId("oTable").getModel("oModel").refresh();
        },

        showExtractTables: function(evt){
            let matnrId = sap.ui.getCore().byId(evt.getSource().getId()).getText();
            let materialDesc = sap.ui.getCore().byId(evt.getSource().getId()).getTooltip();
            let docId;
            if(this.byId("docInvId").getValue() != undefined && this.byId("docInvId").getValue() != ""){
                docId = this.byId("docInvId").getValue();
            }else{
                docId = this.byId("docInvIdByLgpla").getValue();
            }
            this.docIdForExtractTables = docId;
            let title = "Documento: "+docId+"    Material: "+matnrId+" - "+materialDesc;
            
            let oView = this.getView();
            if (!this.byId("ODialogExtractTables")) {
      
                Fragment.load({
                    id: oView.getId(),
                    name: "com.bmore.inveweb.view.fragments.vMCExtractTables",
                    controller: this
                  }).then(function(oDialog){
                    oView.addDependent(oDialog);
                    if (Device.system.desktop) {
                      oDialog.addStyleClass("sapUiSizeCompact");
                    }
                    oDialog.setTitle(title);
                    this.initExtractTables(docId,matnrId);
                    oDialog.open();
                  }.bind(this));
            }else{
                this.byId("ODialogExtractTables").setTitle(title);
                this.initExtractTables(docId,matnrId);
                this.byId("ODialogExtractTables").open();
            }
        },
        _dialogExtractTablesClose:function(){
            this.byId("ODialogExtractTables").close();
        },
        initExtractTables:function(docId,matnrId){
            let MARD = this.frgById("oTableMARD");
            MARD.setModel(new JSONModel([]), "oModelMARD");
    
            let LQUA = this.frgById("oTableLQUA");
            LQUA.setModel(new JSONModel([]), "oModelLQUA");
    
            let MSKU = this.frgById("oTableMSKU");
            MSKU.setModel(new JSONModel([]), "oModelMSKU");
    
            let MSEG = this.frgById("oTableMSEG");
            MSEG.setModel(new JSONModel([]), "oModelMSEG");
    
            let LTAP_LTAK = this.frgById("oTableLTAP_LTAK");
            LTAP_LTAK.setModel(new JSONModel([]), "oModelLTAP_LTAK");
    
            let XTAB6 = this.frgById("oTableXTAB6");
            XTAB6.setModel(new JSONModel([]), "oModelXTAB6");
            this.frgById("tabBarTables").setSelectedKey("key_MARD");
            this.getTables(docId,matnrId);
        },
        getTables: async function (docId,matnrId) {
            const request = {
              docInvId: docId,
              matnr: matnrId
            };
           
            const json = await this.execService(InveServices.GET_EXTRACT_TABLES, request, "getConciliacionDetails", this.showLog);
    
            if (json) {
              let tables = json.lsObject;
              console.log("tables", tables);
              let MARD = this.frgById("oTableMARD");
              MARD.setModel(new JSONModel(tables.emard), "oModelMARD");
    
              let LQUA = this.frgById("oTableLQUA");
              LQUA.setModel(new JSONModel(tables.elqua), "oModelLQUA");
    
              let MSKU = this.frgById("oTableMSKU");
              MSKU.setModel(new JSONModel(tables.emsku), "oModelMSKU");
    
              let MSEG = this.frgById("oTableMSEG");
              MSEG.setModel(new JSONModel(tables.emseg), "oModelMSEG");
    
              let LTAP_LTAK = this.frgById("oTableLTAP_LTAK");
              LTAP_LTAK.setModel(new JSONModel(tables.esalida), "oModelLTAP_LTAK");
    
              let XTAB6 = this.frgById("oTableXTAB6");
              XTAB6.setModel(new JSONModel(tables.extab6), "oModelXTAB6");
    
            }
          },
          sumAmountLabst: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.labst);
            });
            return this.formatNumber(suma);
          },
          sumAmountUmlme: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.umlme);
            });
            return this.formatNumber(suma);
          },
          sumAmountInsme: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.insme);
            });
            return this.formatNumber(suma);
          },
          sumAmountEinme: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.einme);
            });
            return this.formatNumber(suma);
          },
          sumAmountSpeme: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.speme);
            });
            return this.formatNumber(suma);
          },
          sumAmountRetme: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.retme);
            });
            return this.formatNumber(suma);
          },
          export_MARD: function(){
            BusyIndicator.show(0);
            this.exportTableToCSV(this.frgById("tit_MARD"),this.frgById("oTableMARD"),this.frgById("oTableMARD").getModel("oModelMARD").getData());
          },
          sumAmountVerme: function(value){
            try {
              let suma =0;
              value.forEach(element => {
              suma += parseFloat(element.verme);
            });
            return this.formatNumber(suma);
            } catch (e) {
              console.warn(e);
            }
            
          },
    
          export_LQUA: function(){
            BusyIndicator.show(0);
            this.exportTableToCSV(this.frgById("tit_LQUA"),this.frgById("oTableLQUA"),this.frgById("oTableLQUA").getModel("oModelLQUA").getData());
          },
    
          sumAmountKulab: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.kulab);
            });
            return this.formatNumber(suma);
          },
          sumAmountKuins: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.kuins);
            });
            return this.formatNumber(suma);
          },
          sumAmountKuein: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.kuein);
            });
            return this.formatNumber(suma);
          },
          export_MSKU: function(){
            BusyIndicator.show(0);
            this.exportTableToCSV(this.frgById("tit_MSKU"),this.frgById("oTableMSKU"),this.frgById("oTableMSKU").getModel("oModelMSKU").getData());
          },
    
          sumAmountMenge: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.menge);
            });
            return this.formatNumber(suma);
          },
          export_MSEG: function(){
            BusyIndicator.show(0);
            this.exportTableToCSV(this.frgById("tit_MSEG"),this.frgById("oTableMSEG"),this.frgById("oTableMSEG").getModel("oModelMSEG").getData());
          },
    
          sumAmountVistm: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.vistm);
            });
            return this.formatNumber(suma);
          },
          sumAmountNistm: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.nistm);
            });
            return this.formatNumber(suma);
          },
          export_LTAP_LTAK: function(){
            BusyIndicator.show(0);
            this.exportTableToCSV(this.frgById("tit_LTAP_LTAK"),this.frgById("oTableLTAP_LTAK"),this.frgById("oTableLTAP_LTAK").getModel("oModelLTAP_LTAK").getData());
          },
    
          sumAmountDmbtr: function(value){
            let suma =0;
            value.forEach(element => {
              suma += parseFloat(element.dmbtr);
            });
            
            return "$ "+this.formatNumber(suma);
          },
    
          export_XTAB6: function(){
            BusyIndicator.show(0);
            this.exportTableToCSV(this.frgById("tit_XTAB6"),this.frgById("oTableXTAB6"),this.frgById("oTableXTAB6").getModel("oModelXTAB6").getData());
          },
          exportTableToCSV: function(title,oTable,modelData){
            if(modelData == undefined || modelData.length == 0){
                MessageBox.show('Sin información para exportar.',
                        MessageBox.Icon.ERROR, "Sin datos");
                BusyIndicator.hide();
                return;
            }
            
            let columns = [];
            let attribute_column_Map = new Map();
            for(let i in modelData[0]){
              if(this.getColumnByAttribute(i)){
                attribute_column_Map.set(this.getColumnByAttribute(i),i);
              }
            
            }
    
            let columnsTable = oTable.getColumns();
            for(let i in columnsTable){
              let objExport = new Object();
                 objExport.name = columnsTable[i].getHeader().getProperty("text");
                 objExport.template = {
                 content : "{"+attribute_column_Map.get(columnsTable[i].getHeader().getProperty("text"))+"}"
                }
                columns.push(objExport);
            }
    
            let oExport = new Export({
    
              exportType: new ExportTypeCSV({
                  fileExtension: "csv",
                  separatorChar: this.getCharSeparator()
              }),
    
              models: new JSONModel(modelData),
    
              rows: {
                  path: "/"
              },
              
              columns: columns
          });
            
            oExport.saveFile("Doc "+this.docIdForExtractTables+" "+title.getText()+" "+this.byId("ODialogExtractTables").getTitle().split("Material:")[1]).catch(function(oError) {
                console.error("Error al exportar csv",oError);
            }).then(function() {
                oExport.destroy();
                
            }); 
            BusyIndicator.hide();
        },
        getColumnByAttribute: function(att){
            let columns = new Map();
      
            // Set Map Values
            columns.set("matnr", "MATERIAL");
            columns.set("werks", "CENTRO");
            columns.set("lgort", "ALMACÉN");
      
            columns.set("labst", "LIBRE UTILIZACIÓN");
            columns.set("umlme", "TRASLADOS");
            columns.set("insme", "CONTROL DE CALIDAD");
            columns.set("einme", "NO LIBRE");
            columns.set("speme", "BLOQUEADO");
            columns.set("retme", "DEVOLUCIONES");
      
            columns.set("lgnum", "NÚM. ALMACÉN");
            columns.set("lgtyp", "TIPO DE ALMACÉN");
            columns.set("lgpla", "UBICACIÓN");
            columns.set("verme", "STOCK DISPONIBLE");
            columns.set("meins", "U.M.B.");
      
            columns.set("kulab", "LIBRE UTILIZACIÓN");
            columns.set("kuins", "CONTROL DE CALIDAD");
            columns.set("kuein", "NO LIBRE");
      
            columns.set("mblnr", "DOCUMENTO DE MATERIAL");
            columns.set("zeile", "POSICION DOCUMENTO DE MATERIAL");
            columns.set("bwart", "CLASE DE MOVIMIENTO");
            columns.set("insmk", "TIPO DE STOCK");
            columns.set("shkzg", "ENTRADA/SALIDA");
            columns.set("menge", "CANTIDAD");
            columns.set("budat_mkpf", "FECHA DE CONTABILIZACION");
            columns.set("cputm_mkpf", "HORA DE CONTABILIZACION");
            columns.set("nlpla", "UBICACION DESTINO");
            columns.set("nistm", "CANTIDAD DESTINO");
            columns.set("vistm", "CANTIDAD ORIGEN");
            columns.set("qdatu", "FECHA DE CONFIRMACIÓN");
            columns.set("qzeit", "HORA DE CONFIRMACIÓN");
      
            columns.set("dmbtr", "IMPORTE");
            columns.set("waers", "MONEDA");
      
            return columns.get(att);
            
          },
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////FUNCIONES DEL CONTROLADOR DE VCONSAPLGPLA///////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
       
    
    cleanViewLgpla: function(){
            
        setTimeout(function() {
        this.byId("docInvIdByLgpla").setValue("");
        this.byId("bukrsByLgpla").setValue("");
        this.byId("werksByLgpla").setValue("");
        this.byId("dStartByLgpla").setValue("");
        this.byId("dEndByLgpla").setValue("");
        this.byId("createdByLgpla").setValue("");

        this.byId("typeByLgpla").setValue("");
        this.byId("tbSHByLgpla").setPressed(false);
        this.byId("bUploadByLgpla").setEnabled(false);
        this.byId("chkLgpla").setState(false);

        }.bind(this),100);
    },
        switchView: function(){
    
            let state = this.byId("tbSHByLgpla").getPressed();
        
            if (!state) {
        
                this.hideFinancialColumnsLgpla();
                this.byId("btn_Report_LGPLA_PDF").setText("Reporte Conciliación");
                this.byId("btn_Report_LGPLA_PDF").setTooltip("Descargar Reporte Conciliado Pdf");
                
            } else {
                
                this.showFinancialColumnsLgpla();
                this.byId("btn_Report_LGPLA_PDF").setText("Reporte Conciliación Financiero");
                this.byId("btn_Report_LGPLA_PDF").setTooltip("Descargar Reporte Conciliado Financiero Pdf");
            }
            
        },

        getCounterTask: async function(docId){
            const request = {
                tokenObject : null,
                lsObject : {
                    docInvBean:{
                        docInvRelId: docId
                    }
                }
            }
            const json = await this.execService(InveServices.GET_COUNTER_TASK,request,"getCounterTask",this.showLog);
              
            if(json){
                if(json.lsObject.usuario){
                    return json.lsObject.usuario.entity.identyId
                }else{
                    return json.lsObject.groupId;
                }
                
            }
        },

        getLgortsByDoc: async function(docId){
            const request = {
                tokenObject : null,
                lsObject : {
                    docInvRelId: docId
                }
            }
            const json = await this.execService(InveServices.GET_LGORTS_BY_DOC,request,"getLgortsByDoc",this.showLog);
              
            if(json){
                let lista = json.lsObject;
                let str = "";
                for(let i in lista){
                    str != "" ? str += ", "+ lista[i].lgort : str = lista[i].lgort;
                }

                return str;
                
            }
        },

        downloadAccountantPdf : async function(){
            let counter = await this.getCounterTask(this.byId("docInvId").getValue());
            let almacenesContados = await this.getLgortsByDoc(this.byId("docInvId").getValue());
            //////////////////////////////////////////////////////////////////////////
            let dataHeader = this.quantity;
            let sumDif = 0;
            let totDif = 0;

            let itemsCounted = 0;
            let inventoryValue = 0;
            let percent1;
            let percent2;
            let countMatnr = 0;
            let zeroDiffMatnr = 0;
            let difPercWellCount = 0;

            for (let i = 0; i < dataHeader.length; i++) {
    
                sumDif += parseFloat(dataHeader[i].diff.replace(/,/g, ""));
                totDif += (parseFloat(dataHeader[i].diff.replace(/,/g, "")) * parseFloat(dataHeader[i].costByUnit));
                itemsCounted += parseFloat(dataHeader[i].counted.replace(/,/g, "")) + parseFloat(dataHeader[i].countedExpl.replace(/,/g, ""));
                inventoryValue += (parseFloat(dataHeader[i].accountant.replace(/,/g, "")) * parseFloat(dataHeader[i].costByUnit))
                
                countMatnr++;
                if(parseFloat(dataHeader[i].diff.replace(/,/g, "")) == 0){
                    zeroDiffMatnr++;
                }
            }
            
            percent1 = ((parseFloat(sumDif / itemsCounted) * 100).toFixed(3));
            
            if(percent1 > 100){
                percent1 = 100
            }else if(percent1 < -100){
                percent1 = -100
            }
            
            percent2 = ((parseFloat(totDif / inventoryValue) * 100).toFixed(3));
            
            if(percent2 > 100){
                percent2 = 100
            }else if(percent2 < -100){
                percent2 = -100
            }
            
            difPercWellCount = ((parseFloat(zeroDiffMatnr / countMatnr) * 100).toFixed(3));
            difPercWellCount = (isFinite(difPercWellCount) == false ? 0 : difPercWellCount);
            /////////////////////////////////////////////////////////////////////////
			let that = this;
			let tituloPdf = 'CONCILIACIÓN SAP POR CENTRO DOCUMENTO '+this.byId("docInvId").getValue();
			
			let createTableData = function() {
				
				let oTable = that.getView().byId('oTable');  
				let data = oTable.getModel("oModel").getData();		


				let mapArr = data.map(function(item) {
						
                    let constDiff = parseFloat(item.counted.replace(/,/g, "")) + parseFloat(item.countedExpl.replace(/,/g, "")) - parseFloat(item.accountant.replace(/,/g, ""))
                    let difference = parseFloat(item.diff.replace(/,/g, ""));	
                        let percentDiff = "";
                        
                        if(difference == 0 || constDiff == 0){
                            percentDiff = 0;
                        }else{
                            percentDiff = ((difference / item.counted.replace(/,/g, "")).toFixed(2) * 100);
                            percentDiff = (isFinite(percentDiff) == false ? 0 :  percentDiff);
                        }
                        
                        if(percentDiff > 100){
                            percentDiff = 100
                        }else if(percentDiff < -100){
                            percentDiff = -100
                        }
                                    
                        
                //////
                let totJsQuant = 0;
                let quant;
    
                let jsConcat = "";
                if(item.lsJustification){
                    for (let j = 0; j < item.lsJustification.length; j++) {
                        quant = item.lsJustification[j].quantity.replace(/,/g, "");
                        quant = parseFloat(quant)
                        totJsQuant += parseFloat(quant);
                        jsConcat += "(" + item.lsJustification[j].quantity.replace(/,/g, "") + " ; "
                        jsConcat += item.lsJustification[j].justify + "); ";				
                    }
                }
                
                        let tableItem = 'tableItem';
						let ret = [{
                            text: item.category,
                            style: tableItem
                        },{
							text: item.matnr,
                            style: tableItem
						},{
							text: item.matnrD,
                            style: tableItem
						}, {
                            text: item.meins,
                            style: tableItem
                        }, {
                            text: item.counted,
                            style: tableItem
                        }, {
                            text: item.theoric,
                            style: tableItem
                        }, {
                            text: item.accountant,
                            style: tableItem
                        }, {
                            text: item.transit,
                            style: tableItem
                        }, {
                            text: item.consignation,
                            style: tableItem
                        }, {
                            text: difference,
                            style: tableItem
                        }, {
                            text: "Consignación: " + that.formatNumber(item.consignation) + "\nTránsito: " + that.formatNumber(item.transit)+"\nJustificación: " + jsConcat,//Resumen,
                            style: tableItem
                        }];
						return ret;
				});

				// Encabezados de la tabla
                //Categoría
				mapArr.unshift(
						[{
							text: 'Categoria',
							style: 'tableHeader'
						}, {
							text: 'Material',
							style: 'tableHeader'
						}, {
							text: 'Descripción',
							style: 'tableHeader'
						}, {
							text: 'U.M.B',
							style: 'tableHeader'
						}, {
							text: 'Inv. Físico',
							style: 'tableHeader'
						}, {
							text: 'Teórico',
							style: 'tableHeader'
						}, {
							text: 'Contable Cantidad',
							style: 'tableHeader'
						}, {
							text: 'Tránsito',
							style: 'tableHeader'
						}, {
							text: 'Consignación',
							style: 'tableHeader'
						}, {
							text: 'Diferencia',
							style: 'tableHeader'
						}, {
							text: 'Resumen',
							style: 'tableHeader'
						}]
				);
				// Totales
				mapArr.push([
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""}

				]);
				return mapArr;
			};
			let createColumnFilter = function(key,value) {
				return ([
						{
						width: '20%',
						text: key,
						style: 'filterKey'
						},
						{
						width: '60%',
						text: value,
						style: 'filterValue'
						}]);
			}
			let docDefinition = {
				info: {
						title: tituloPdf,
						author: 'INVEWEB',
						subject: 'Inventarios ciclicos',
						producer: 'system-inveweb',
						creator: 'system-inveweb'
				},
				pageOrientation: 'landscape',
				content: [{
                        //alignment: 'justify',
                        columns: [
                            {
                                text: tituloPdf,
                                style: 'header',
                            },
                            {
                                
                                image: "data:image/png;base64,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",
                                width: 48, 
                                height: 48
                              },
                              {
                                
                                image: "data:image/png;base64,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", 
                                width: 48, 
                                height: 48
                              }
                            
                        ]
                    },
					{
					columns: createColumnFilter('Documento de Inventario:',that.byId('docInvId').getValue())
					},
					{
					columns: createColumnFilter('Sociedad:',that.byId('bukrs').getValue())
					},
					{
					columns: createColumnFilter('Centro:',that.byId('werks').getValue())
					},
                    {
                    columns: createColumnFilter('Almacenes:',almacenesContados)
                    },
					{
					columns: createColumnFilter('Fecha Creación:',that.byId('dStart').getValue())
					},
                    {
                    columns: createColumnFilter('Fecha Cierre:',that.byId('dEnd').getValue())
                    },			
					{
					columns: createColumnFilter('Conciliado por:',that.byId('createdBy').getValue())
					},	
                    {
                    columns: createColumnFilter('Contado por:',counter)
                    },		
					{
					columns: createColumnFilter('Tipo de Documento:',that.byId('type').getValue())
					},
                    {
                        columns:[
                            {
                                text: "Items Contados\n"+that.formatNumber(itemsCounted),
                                fontSize: 7
                            },
                            {
                                text: "Items con Diferencia\n"+that.formatNumber(sumDif),
                                fontSize: 7
                            },
                            {
                                text: "Items Diferencia %\n"+(isFinite(percent1) == false ? 0 : percent1) + "%",
                                fontSize: 7
                            },
                            {
                                text: "SKU´s Contados\n"+that.formatNumber(countMatnr),
                                fontSize: 7
                            },
                            {
                                text: "SKU´s Correctos\n"+that.formatNumber(zeroDiffMatnr),
                                fontSize: 7
                            },
                            {
                                text: "SKU´s % Correcto\n"+difPercWellCount + "%",
                                fontSize: 7
                            }
                        ]
                    },			
					{
					table: {
						headerRows: 0,
						//       1    2  3   4   5   6   7   8   9   10  11
                        widths: [60, 30, 80, 20, 35, 35, 35, 35, 40, 37, 200],
						body: createTableData()
					},
					layout: 'primaryLayout'
				}],
				footer: function(currentPage, pageCount) {
						return {text: currentPage.toString() + ' / ' + pageCount, alignment: 'center'};
				},
				styles: {
					header: {
						fontSize: 14,
						bold: true,
						margin: [0, 0, 0, 5]
					},
					filterKey: {
						fontSize: 9,
						bold: true,
					},
					filterValue: {
						fontSize: 7,
						bold: false,
					},
					tableHeader: {
						bold: true,
						fontSize: 7,
						color: 'black',
						margin: [0, 15, 0, 0]
					},
					tableItem: {
						bold: false,
						fontSize: 7,
						margin: [0, 0, 0, 0]
					}
				}
			};
			sap.ui.require(["thirdparty/pdfmake/build/vfs_fonts"], function(vfs_fonts){
				pdfMake.tableLayouts = {
					primaryLayout: {
						hLineWidth: function (i, node) {
						if (i === 0 || i === node.table.body.length) {
							return 0;
						}
						return (i === node.table.headerRows) ? 2 : 1;
						},
						vLineWidth: function (i) {
						return 0;
						},
						hLineColor: function (i) {
						return i === 1 ? 'black' : '#aaa';
						},
						paddingLeft: function (i) {
						return i === 0 ? 0 : 8;
						},
						paddingRight: function (i, node) {
						return (i === node.table.widths.length - 1) ? 0 : 8;
						}
					}
				};
            	pdfMake.createPdf(docDefinition).download("Conciliación_SAP_Centro_DocInv_" + that.byId("docInvId").getValue()+".pdf");
			});
        },

        loadPDFReport: function(){
            let financiera = this.byId("tbSH").getPressed();
            if(financiera){
                this.downloadAccountantCOST_Pdf();
            }else{
                this.downloadAccountantPdf();
            }
            
        },

        downloadAccountantCOST_Pdf : async function(){
            let counter = await this.getCounterTask(this.byId("docInvId").getValue());
            let almacenesContados = await this.getLgortsByDoc(this.byId("docInvId").getValue());
            //////////////////////////////////////////////////////////////////////////
            let dataHeader = this.quantity;
            let sumDif = 0;
            let totDif = 0;

            let itemsCounted = 0;
            let inventoryValue = 0;
            let percent1;
            let percent2;
            let countMatnr = 0;
            let zeroDiffMatnr = 0;
            let difPercWellCount = 0;

            for (let i = 0; i < dataHeader.length; i++) {
    
                sumDif += parseFloat(dataHeader[i].diff.replace(/,/g, ""));
                totDif += (parseFloat(dataHeader[i].diff.replace(/,/g, "")) * parseFloat(dataHeader[i].costByUnit));
                itemsCounted += parseFloat(dataHeader[i].counted.replace(/,/g, "")) + parseFloat(dataHeader[i].countedExpl.replace(/,/g, ""));
                inventoryValue += (parseFloat(dataHeader[i].accountant.replace(/,/g, "")) * parseFloat(dataHeader[i].costByUnit))
                
                countMatnr++;
                if(parseFloat(dataHeader[i].diff.replace(/,/g, "")) == 0){
                    zeroDiffMatnr++;
                }
            }
            
            percent1 = ((parseFloat(sumDif / itemsCounted) * 100).toFixed(3));
            
            if(percent1 > 100){
                percent1 = 100
            }else if(percent1 < -100){
                percent1 = -100
            }
            
            percent2 = ((parseFloat(totDif / inventoryValue) * 100).toFixed(3));
            
            if(percent2 > 100){
                percent2 = 100
            }else if(percent2 < -100){
                percent2 = -100
            }
            
            difPercWellCount = ((parseFloat(zeroDiffMatnr / countMatnr) * 100).toFixed(3));
            difPercWellCount = (isFinite(difPercWellCount) == false ? 0 : difPercWellCount);
            /////////////////////////////////////////////////////////////////////////
			let that = this;
			let tituloPdf = 'CONCILIACIÓN SAP (FINANCIERO) POR CENTRO DOCUMENTO '+this.byId("docInvId").getValue();
			
			let createTableData = function() {
				
				//let oTable = that.getView().byId('oTable');  
				let data = that.copyObjToNew(that.quantity);		


				let mapArr = data.map(function(item) {
						
                    let constDiff = parseFloat(item.counted.replace(/,/g, "")) + parseFloat(item.countedExpl.replace(/,/g, "")) - parseFloat(item.accountant.replace(/,/g, ""))
                    let difference = parseFloat(item.diff.replace(/,/g, "").replace("$", ""));	
                        let percentDiff = "";
                        
                        if(difference == 0 || constDiff == 0){
                            percentDiff = 0;
                        }else{
                            percentDiff = ((difference / item.counted.replace(/,/g, "")).toFixed(2) * 100);
                            percentDiff = (isFinite(percentDiff) == false ? 0 :  percentDiff);
                        }
                        
                        if(percentDiff > 100){
                            percentDiff = 100
                        }else if(percentDiff < -100){
                            percentDiff = -100
                        }
                                    
                        
                //////
                let totJsQuant = 0;
                let quant;
    
                let jsConcat = "";
                
                for (let j = 0; j < item.lsJustification.length; j++) {
                    quant = item.lsJustification[j].quantity.replace(/,/g, "");
                    quant = parseFloat(quant)
                    totJsQuant += parseFloat(quant);
                    jsConcat += "(" + item.lsJustification[j].quantity.replace(/,/g, "") + " ; "
                    jsConcat += item.lsJustification[j].justify + "); ";				
                }
                        let tableItem = 'tableItem';
						let ret = [{
                            text: item.category,
                            style: tableItem
                        },{
							text: item.matnr,
                            style: tableItem
						},{
							text: item.matnrD,
                            style: tableItem
						}, {
                            text: item.meins,
                            style: tableItem
                        }, {
                            text: item.counted,
                            style: tableItem
                        }, {
                            text: item.theoric,
                            style: tableItem
                        }, {
                            text: item.accountant,
                            style: tableItem
                        }, {
                            text: item.transit,
                            style: tableItem
                        }, {
                            text: item.consignation,
                            style: tableItem
                        }, {
                            text: difference,
                            style: tableItem
                        }, {
                            text: "$"+that.formatNumber(item.costByUnit),
                            style: tableItem
                        }, {
                            text: "$"+that.formatNumber((parseFloat(item.accountant.replace(/,/g, "")) * parseFloat(item.costByUnit))),//costAccountant,
                            style: tableItem
                        }, {
                            text: "$"+that.formatNumber((difference * parseFloat(item.costByUnit))),//difference,
                            style: tableItem
                        }, {
                            text: that.formatNumber(totJsQuant),//totJsQuant,
                            style: tableItem
                        }, {
                            text: "$"+that.formatNumber((totJsQuant * item.costByUnit)),//justificacion valor,
                            style: tableItem
                        }, {
                            text: ((totJsQuant == 0 || constDiff == 0) ? 0 : Math.abs((totJsQuant / constDiff).toFixed(2) * 100)) + "%",
                            style: tableItem
                        }, {
                            text: percentDiff+"%",
                            style: tableItem
                        }, {
                            text: "Consignación: " + that.formatNumber(item.consignation) + "\nTránsito: " + that.formatNumber(item.transit)+"\nJustificación: " + jsConcat,//Resumen,
                            style: tableItem
                        }];
						return ret;
				});

				// Encabezados de la tabla
                //Categoría
				mapArr.unshift(
						[{
							text: 'Cat',
							style: 'tableHeader'
						}, {
							text: 'Material',
							style: 'tableHeader'
						}, {
							text: 'Descripción',
							style: 'tableHeader'
						}, {
							text: 'U.M.B',
							style: 'tableHeader'
						}, {
							text: 'Inv. Físico',
							style: 'tableHeader'
						}, {
							text: 'Teórico',
							style: 'tableHeader'
						}, {
							text: 'Contable Cant',
							style: 'tableHeader'
						}, {
							text: 'Tránsito',
							style: 'tableHeader'
						}, {
							text: 'Consignación',
							style: 'tableHeader'
						}, {
							text: 'Dif. Cant. UMB',
							style: 'tableHeader'
						}, {
							text: 'Precio',
							style: 'tableHeader'
						}, {
							text: 'Contable Valor',
							style: 'tableHeader'
						}, {
							text: 'Dif. Valor UMB',
							style: 'tableHeader'
						}, {
							text: 'Just. Cant.',
							style: 'tableHeader'
						}, {
							text: 'Just. Valor',
							style: 'tableHeader'
						}, {
							text: 'Just. %',
							style: 'tableHeader'
						}, {
							text: 'Dif. %',
							style: 'tableHeader'
						}, {
							text: 'Resumen',
							style: 'tableHeader'
						}]
				);
				// Totales
				mapArr.push([
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""}

				]);
				return mapArr;
			};
			let createColumnFilter = function(key,value) {
				return ([
						{
						width: '20%',
						text: key,
						style: 'filterKey'
						},
						{
						width: '60%',
						text: value,
						style: 'filterValue'
						}]);
			}
			let docDefinition = {
				info: {
						title: tituloPdf,
						author: 'INVEWEB',
						subject: 'Inventarios ciclicos',
						producer: 'system-inveweb',
						creator: 'system-inveweb'
				},
				pageOrientation: 'landscape',
				content: [ {
                    columns: [
                        {
                            text: tituloPdf,
                            style: 'header',
                        },
                        {
                            
                            image: "data:image/png;base64,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",
                            width: 48, 
                            height: 48
                          },
                          {
                            
                            image: "data:image/png;base64,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", 
                            width: 48, 
                            height: 48
                          }
                        
                    ]
					},
					{
					columns: createColumnFilter('Documento de Inventario:',that.byId('docInvId').getValue())
					},
					{
					columns: createColumnFilter('Sociedad:',that.byId('bukrs').getValue())
					},
					{
					columns: createColumnFilter('Centro:',that.byId('werks').getValue())
					},
                    {
                    columns: createColumnFilter('Almacenes:',almacenesContados)
                    },
					{
					columns: createColumnFilter('Fecha Creación:',that.byId('dStart').getValue())
					},
                    {
                        columns: createColumnFilter('Fecha Cierre:',that.byId('dEnd').getValue())
                    },			
					{
					columns: createColumnFilter('Conciliado por:',that.byId('createdBy').getValue())
					},	
                    {
                        columns: createColumnFilter('Contado por:',counter)
                    },		
					{
					columns: createColumnFilter('Tipo de Documento:',that.byId('type').getValue())
					},
                    {
                        columns:[
                            {
                                text: "Valor Inventario\n$ "+that.formatNumber(inventoryValue),
                                fontSize: 7
                            },
                            {
                                text: "Valor Diferencia\n$ "+that.formatNumber(totDif),
                                fontSize: 7
                            },
                            {
                                text: "Valor Diferencia %\n"+(isFinite(percent2) == false ? 0 : percent2) + "%",
                                fontSize: 7
                            }
                        ]
                    },			
					{
					table: {
						headerRows: 0,
						//       1   2   3   4   5   6   7   8   9   10  11  12  13  14  15  16  17  18
                        widths: [20, 27, 50, 20, 25, 25, 25, 27, 20, 20, 23, 20, 20, 20, 20, 20, 20, 60],
						body: createTableData()
					},
					layout: 'primaryLayout'
				}],
				footer: function(currentPage, pageCount) {
						return {text: currentPage.toString() + ' / ' + pageCount, alignment: 'center'};
				},
				styles: {
					header: {
						fontSize: 14,
						bold: true,
						margin: [0, 0, 0, 5]
					},
					filterKey: {
						fontSize: 9,
						bold: true,
					},
					filterValue: {
						fontSize: 7,
						bold: false,
					},
					tableHeader: {
						bold: true,
						fontSize: 7,
						color: 'black',
						margin: [0, 15, 0, 0]
					},
					tableItem: {
						bold: false,
						fontSize: 7,
						margin: [0, 0, 0, 0]
					}
				}
			};
			sap.ui.require(["thirdparty/pdfmake/build/vfs_fonts"], function(vfs_fonts){
				pdfMake.tableLayouts = {
					primaryLayout: {
						hLineWidth: function (i, node) {
						if (i === 0 || i === node.table.body.length) {
							return 0;
						}
						return (i === node.table.headerRows) ? 2 : 1;
						},
						vLineWidth: function (i) {
						return 0;
						},
						hLineColor: function (i) {
						return i === 1 ? 'black' : '#aaa';
						},
						paddingLeft: function (i) {
						return i === 0 ? 0 : 8;
						},
						paddingRight: function (i, node) {
						return (i === node.table.widths.length - 1) ? 0 : 8;
						}
					}
				};
            	pdfMake.createPdf(docDefinition).download("Conciliación_SAP_Financiero_Centro_DocInv_" + that.byId("docInvId").getValue()+".pdf");
			});
        },
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        downloadAccountant_LGPLA_Pdf : async function(){
            let counter = await this.getCounterTask(this.byId("docInvIdByLgpla").getValue());
            let almacenesContados = await this.getLgortsByDoc(this.byId("docInvIdByLgpla").getValue());
            //////////////////////////////////////////////////////////////////////////
            let dataHeader =  this.row;
            
			let sumDif = 0;
            let totDif = 0;
            let totDifComplete = 0;
            let diffPercent = 0;
            let itemsCounted = 0;
            let inventoryValue = 0;
            let percent1;
            let percent2;
            let contado = 0;
            let zeroDiffCounted = 0;
            let difPercWellCount = 0;

            for (let i = 0; i < dataHeader.length; i++) {
    
				totDifComplete += (parseFloat(dataHeader[i].diff.replace(/,/g, "")) * parseFloat(dataHeader[i].costByUnit));
				if(dataHeader[i].lgpla != undefined && dataHeader[i].lgpla.length > 0){
                    
                    if(parseFloat(dataHeader[i].diff.replace(/,/g, "")) != 0){
                        sumDif++;
                    }
                    
                    itemsCounted ++;
                }
                totDif += (parseFloat(dataHeader[i].diff.replace(/,/g, "")) * parseFloat(dataHeader[i].costByUnit));
                let couCo = dataHeader[i].theoricCost.replace(/,/g, "");
                couCo = couCo.replace(/\$/g, "");
                inventoryValue += (parseFloat(couCo));
                
                contado++;
                if(parseFloat(dataHeader[i].diff.replace(/,/g, "")) == 0){
                    zeroDiffCounted++;
                }
            }
            
            percent1 = ((parseFloat(sumDif / itemsCounted) * 100).toFixed(3));
            
            if(isNaN(percent1)){
                percent1 = "N/A"
            }else{
                if(percent1 > 100){
                    percent1 = 100
                }else if(percent1 < -100){
                    percent1 = -100
                }
                percent1 +="%"
            }
            
            percent2 = ((parseFloat(totDifComplete / inventoryValue) * 100).toFixed(3));
            
            if(percent2 > 100){
                percent2 = 100
            }else if(percent2 < -100){
                percent2 = -100
            }	
            
            difPercWellCount = ((parseFloat(zeroDiffCounted / contado) * 100).toFixed(3));
            difPercWellCount = (isFinite(difPercWellCount) == false ? 0 : difPercWellCount);
			
			inventoryValue = "$"+inventoryValue;
            
            totDifComplete = "$"+totDifComplete;
            /////////////////////////////////////////////////////////////////////////
			let that = this;
			let tituloPdf = 'CONCILIACIÓN SAP POR UBICACIÓN DOCUMENTO '+this.byId("docInvIdByLgpla").getValue();
			
			let createTableData = function() {
				
				 
				let data =  that.row;		


				let mapArr = data.map(function(item) {
						
                let counted = (parseFloat(item.counted.replace(/,/g, "")) + parseFloat(item.countedExpl.replace(/,/g, "")))
                
                let difference = parseFloat(item.diff.replace(/,/g, ""));
                let percentDiff = "";
                
                if(difference == 0 || counted == 0){
                    percentDiff = 0
                }else{
                    percentDiff = ((difference / counted).toFixed(2) * 100);
                    percentDiff = (isFinite(percentDiff) == false ? 0 :  percentDiff);
                }
                 
                percentDiff = Math.abs(percentDiff) > 100? 100: percentDiff;
                         
				let dateIni;
				 if(item.dateIniCounted != undefined && item.dateIniCounted > 0){
                    dateIni= that.formatDate(new Date(item.dateIniCounted))
                }else{
                    dateIni= "N/A"
                }
                
				let dateEnd;
                if(item.dateEndCounted != undefined && item.dateEndCounted > 0){
                    dateEnd= that.formatDate(new Date(item.dateEndCounted))
                }else{
                    dateEnd= "N/A"
                }
                        
                //////
                let totJsQuant = 0;
                let quant;
    
                let jsConcat = "";
                
                if(item.lsJustification){
                    for (let j = 0; j < item.lsJustification.length; j++) {
                        quant = item.lsJustification[j].quantity.replace(/,/g, "");
                        quant = parseFloat(quant)
                        totJsQuant += parseFloat(quant);
                        jsConcat += "(" + item.lsJustification[j].quantity.replace(/,/g, "") + " ; "
                        jsConcat += item.lsJustification[j].justify + "); ";				
                    }
                }
                
                
                let justCant = totJsQuant  //Justificación Cantidad
                //let justVal = "$" + (totJsQuant * parseFloat(item.costByUnit)) //Justificación Valor
                
                let percentJs = "";
                let diffJs = parseFloat(item.countedTot.replace(/,/g, "")) - parseFloat(item.theoric.replace(/,/g, ""));
                
                if(totJsQuant == 0){
                    percentJs = 0;				
                }else{				
                    if(diffJs == 0 && totJsQuant > 0){
                        percentJs = 100;
                    }else{
                        percentJs = Math.abs((totJsQuant / diffJs).toFixed(2) * 100);
                    }
                            
                }
                
                let percJust = percentJs + "%,"	//Justificación Porcentual		"
                let justCon= "Justificación: " + jsConcat;
				
                        let tableItem = 'tableItem';
						let ret = [{
                            text: item.lgort,//Almacen
                            style: tableItem
                        },{
							text: (item.lgpla == undefined ? "" : item.lgpla),//ubicacion
                            style: tableItem
						},{
							text: item.matnr,//MATERIAL
                            style: tableItem
						},{
							text: item.matnrD,//DESCRIPCION
                            style: tableItem
						}, {
                            text: item.meins,//UMB
                            style: tableItem
                        }, {
                            text: (item.vhilmCounted == undefined ? "0" : item.vhilmCounted),//Tarimas Contadas
                            style: tableItem
                        }, {
                            text: (item.build != undefined ? item.build : "N/A"),//Armado
                            style: tableItem
                        }, {
                            text: item.countedTot,//Total Contado
                            style: tableItem
                        }, {
                            text: item.theoric,//Contado Teórico
                            style: tableItem
                        }, {
                            text: item.diff,//Diferencia en Cantidad en UMB
                            style: tableItem
                        },{
                            text: dateIni,//
                            style: tableItem
                        }, {
                            text: dateEnd,//
                            style: tableItem
                        }, {
							text: justCant,//Cantidad Justificada
                            style: tableItem
						},{
                            text: percJust,
                            style: tableItem
                        },{
                            text: justCon,
                            style: tableItem
                        }

						// {
                        //     text: item.countedCost,//Costo Contado
                        //     style: tableItem
                        // }, {
                        //     text: item.theoricCost,//Costo Teórico
                        //     style: tableItem
                        // }, {
                        //     text: item.diffCost,//Diferencia en Valor en UMB
                        //     style: tableItem
                        // }, {
                        //     text: percentDiff + "%",//Diferencia Porcentual
                        //     style: tableItem
                        // }, {
                        //     text: dateIni,//
                        //     style: tableItem
                        // }, {
                        //     text: dateEnd,//
                        //     style: tableItem
                        // }, {
                        //     text: (item.note != undefined ? item.note : "N/A" ),//
                        //     style: tableItem
                        // }, {
                        //     text: (item.prodDate != undefined ? item.prodDate : "N/A" ),//
                        //     style: tableItem
                        // }, {
                        //     text: counted,//
                        //     style: tableItem
                        // }, {
                        //     text: item.countedExpl,//
                        //     style: tableItem
                        // }, {
                        //     text: item.cVal,//
                        //     style: tableItem
                        // }, {
                        //     text: "$" +item.costByUnit,//
                        //     style: tableItem
                        // }, {
                        //     text: justCant,
                        //     style: tableItem
                        // }, {
                        //     text: justVal,
                        //     style: tableItem
                        // }, {
                        //     text: percJust,
                        //     style: tableItem
                        // }, {
                        //     text: justCon,
                        //     style: tableItem
                        // }
                    ];
						return ret;
				});

				// Encabezados de la tabla
                //Categoría
				mapArr.unshift(
						[{
							text: 'Almacén',
							style: 'tableHeader'
						}, {
							text: ' Ubicación',
							style: 'tableHeader'
						}, {
							text: ' Material',
							style: 'tableHeader'
						}, {
							text: ' Descripción',
							style: 'tableHeader'
						}, {
							text: ' UMB',
							style: 'tableHeader'
						}, {
							text: ' Tarimas Contadas',
							style: 'tableHeader'
						}, {
							text: ' Armado',
							style: 'tableHeader'
						}, {
							text: ' Total Contado',
							style: 'tableHeader'
						}, {
							text: ' Contado Teórico',
							style: 'tableHeader'
						}, {
							text: ' Dif. Cantidad',
							style: 'tableHeader'
						}, {
							text: ' Fecha Inicio',
							style: 'tableHeader'
						}, {
							text: ' Fecha Fin',
							style: 'tableHeader'
						}, {
							text: ' Cantidad Justificada',
							style: 'tableHeader'
						}, {
							text: ' % Justificado',
							style: 'tableHeader'
						}, {
							text: ' Resumen',
							style: 'tableHeader'
						}]
				);
				// Totales
				mapArr.push([
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""}

				]);
				return mapArr;
			};
			let createColumnFilter = function(key,value) {
				return ([
						{
						width: '20%',
						text: key,
						style: 'filterKey'
						},
						{
						width: '60%',
						text: value,
						style: 'filterValue'
						}]);
			}
			let docDefinition = {
				info: {
						title: tituloPdf,
						author: 'INVEWEB',
						subject: 'Inventarios ciclicos',
						producer: 'system-inveweb',
						creator: 'system-inveweb'
				},
				pageOrientation: 'landscape',
				content: [{
                        //alignment: 'justify',
                        columns: [
                            {
                                text: tituloPdf,
                                style: 'header',
                            },
                            {
                                
                                image: "data:image/png;base64,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",
                                width: 48, 
                                height: 48
                              },
                              {
                                
                                image: "data:image/png;base64,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", 
                                width: 48, 
                                height: 48
                              }
                            
                        ]
                    },
					{
					columns: createColumnFilter('Documento de Inventario:',that.byId('docInvIdByLgpla').getValue())
					},
					{
					columns: createColumnFilter('Sociedad:',that.byId('bukrsByLgpla').getValue())
					},
					{
					columns: createColumnFilter('Centro:',that.byId('werksByLgpla').getValue())
					},
                    {
                    columns: createColumnFilter('Almacenes:',almacenesContados)
                    },
					{
					columns: createColumnFilter('Fecha Creación:',that.byId('dStartByLgpla').getValue())
					},
                    {
                    columns: createColumnFilter('Fecha Cierre:',that.byId('dEndByLgpla').getValue())
                    },			
					{
					columns: createColumnFilter('Conciliado por:',that.byId('createdByLgpla').getValue())
					},	
                    {
                    columns: createColumnFilter('Contado por:',counter)
                    },		
					{
					columns: createColumnFilter('Tipo de Documento:',that.byId('typeByLgpla').getValue())
					},
                    {
                        columns:[
                            {
                                text: "Materiales Contados\n"+that.formatNumber(contado),
                                fontSize: 7,
                                margin: [0, 15, 0, 0]
                            },
                            {
                                text: "Materiales correctos\n"+that.formatNumber(zeroDiffCounted),
                                fontSize: 7,
                                margin: [0, 15, 0, 0]
                            },
                            {
                                text: "% Correcto\n"+difPercWellCount + "%",
                                fontSize: 7,
                                margin: [0, 15, 0, 0]
                            }
                        ]
                    },			
					{
					table: {
						headerRows: 0,
						//       1    2   3   4   5   6   7   8  9 10  11  12  13  14  15
                        widths: [28, 33, 32, 85, 20, 35, 35, 35,35,35, 35, 35, 35, 35, 80],
						body: createTableData()
					},
					layout: 'primaryLayout'
				}],
				footer: function(currentPage, pageCount) {
						return {text: currentPage.toString() + ' / ' + pageCount, alignment: 'center'};
				},
				styles: {
					header: {
						fontSize: 14,
						bold: true,
						margin: [0, 0, 0, 5]
					},
					filterKey: {
						fontSize: 9,
						bold: true,
					},
					filterValue: {
						fontSize: 7,
						bold: false,
					},
					tableHeader: {
						bold: true,
						fontSize: 7,
						color: 'black',
						margin: [0, 15, 0, 0]
					},
					tableItem: {
						bold: false,
						fontSize: 7,
						margin: [0, 0, 0, 0]
					}
				}
			};
			sap.ui.require(["thirdparty/pdfmake/build/vfs_fonts"], function(vfs_fonts){
				pdfMake.tableLayouts = {
					primaryLayout: {
						hLineWidth: function (i, node) {
						if (i === 0 || i === node.table.body.length) {
							return 0;
						}
						return (i === node.table.headerRows) ? 2 : 1;
						},
						vLineWidth: function (i) {
						return 0;
						},
						hLineColor: function (i) {
						return i === 1 ? 'black' : '#aaa';
						},
						paddingLeft: function (i) {
						return i === 0 ? 0 : 8;
						},
						paddingRight: function (i, node) {
						return (i === node.table.widths.length - 1) ? 0 : 8;
						}
					}
				};
            	pdfMake.createPdf(docDefinition).download("Conciliación_SAP_Ubicación_DocInv_" + that.byId("docInvIdByLgpla").getValue()+".pdf");
			});
        },

        downloadAccountant_LGPLA_COST_Pdf : async function(){
            let counter = await this.getCounterTask(this.byId("docInvIdByLgpla").getValue());
            let almacenesContados = await this.getLgortsByDoc(this.byId("docInvIdByLgpla").getValue());
            //////////////////////////////////////////////////////////////////////////
            let dataHeader =  this.row;
            
			let sumDif = 0;
            let totDif = 0;
            let totDifComplete = 0;
            let diffPercent = 0;
            let itemsCounted = 0;
            let inventoryValue = 0;
            let percent1;
            let percent2;
            let contado = 0;
            let zeroDiffCounted = 0;
            let difPercWellCount = 0;

            for (let i = 0; i < dataHeader.length; i++) {
    
				totDifComplete += (parseFloat(dataHeader[i].diff.replace(/,/g, "")) * parseFloat(dataHeader[i].costByUnit));
				if(dataHeader[i].lgpla != undefined && dataHeader[i].lgpla.length > 0){
                    
                    if(parseFloat(dataHeader[i].diff.replace(/,/g, "")) != 0){
                        sumDif++;
                    }
                    
                    itemsCounted ++;
                }
                totDif += (parseFloat(dataHeader[i].diff.replace(/,/g, "")) * parseFloat(dataHeader[i].costByUnit));
                let couCo = dataHeader[i].theoricCost.replace(/,/g, "");
                couCo = couCo.replace(/\$/g, "");
                inventoryValue += (parseFloat(couCo));
                
                contado++;
                if(parseFloat(dataHeader[i].diff.replace(/,/g, "")) == 0){
                    zeroDiffCounted++;
                }
            }
            
            percent1 = ((parseFloat(sumDif / itemsCounted) * 100).toFixed(3));
            
            if(isNaN(percent1)){
                percent1 = "N/A"
            }else{
                if(percent1 > 100){
                    percent1 = 100
                }else if(percent1 < -100){
                    percent1 = -100
                }
                percent1 +="%"
            }
            
            percent2 = ((parseFloat(totDifComplete / inventoryValue) * 100).toFixed(3));
            
            if(percent2 > 100){
                percent2 = 100
            }else if(percent2 < -100){
                percent2 = -100
            }	
            
            difPercWellCount = ((parseFloat(zeroDiffCounted / contado) * 100).toFixed(3));
            difPercWellCount = (isFinite(difPercWellCount) == false ? 0 : difPercWellCount);
			
			inventoryValue = "$"+this.formatNumber(inventoryValue);
            
            totDifComplete = "$"+this.formatNumber(totDifComplete);
            /////////////////////////////////////////////////////////////////////////
			let that = this;
			let tituloPdf = 'CONCILIACIÓN SAP FINANCIERO POR UBICACIÓN DOCUMENTO '+this.byId("docInvIdByLgpla").getValue();
			
			let createTableData = function() {
				
				//let oTable = that.getView().byId('oTableByLgpla');  
				let data =  that.row;		


				let mapArr = data.map(function(item) {
						
                let counted = (parseFloat(item.counted.replace(/,/g, "")) + parseFloat(item.countedExpl.replace(/,/g, "")))
                
                let difference = parseFloat(item.diff.replace(/,/g, ""));
                let percentDiff = "";
                
                if(difference == 0 || counted == 0){
                    percentDiff = 0
                }else{
                    percentDiff = ((difference / counted).toFixed(2) * 100);
                    percentDiff = (isFinite(percentDiff) == false ? 0 :  percentDiff);
                }
                 
                percentDiff = Math.abs(percentDiff) > 100? 100: percentDiff;
                         
				let dateIni;
				 if(item.dateIniCounted != undefined && item.dateIniCounted > 0){
                    dateIni= that.formatDate(new Date(item.dateIniCounted))
                }else{
                    dateIni= "N/A"
                }
                
				let dateEnd;
                if(item.dateEndCounted != undefined && item.dateEndCounted > 0){
                    dateEnd= that.formatDate(new Date(item.dateEndCounted))
                }else{
                    dateEnd= "N/A"
                }
                        
                //////
                let totJsQuant = 0;
                let quant;
    
                let jsConcat = "";
                
                for (let j = 0; j < item.lsJustification.length; j++) {
                    quant = item.lsJustification[j].quantity.replace(/,/g, "");
                    quant = parseFloat(quant)
                    totJsQuant += parseFloat(quant);
                    jsConcat += "(" + item.lsJustification[j].quantity.replace(/,/g, "") + " ; "
                    jsConcat += item.lsJustification[j].justify + "); ";				
                }
                
                let justCant = totJsQuant + "," //Justificación Cantidad
                let justVal = "$" + (totJsQuant * parseFloat(item.costByUnit)) //Justificación Valor
                
                let percentJs = "";
                let diffJs = parseFloat(item.countedTot.replace(/,/g, "")) - parseFloat(item.theoric.replace(/,/g, ""));
                
                if(totJsQuant == 0){
                    percentJs = 0;				
                }else{				
                    if(diffJs == 0 && totJsQuant > 0){
                        percentJs = 100;
                    }else{
                        percentJs = Math.abs((totJsQuant / diffJs).toFixed(2) * 100);
                    }
                            
                }
                
                let percJust = percentJs + "%"	//Justificación Porcentual		"
                let justCon= "Justificación: " + jsConcat;
				
                        let tableItem = 'tableItem';
						let ret = [{
                            text: item.lgort,//Almacen
                            style: tableItem
                        },{
							text: (item.lgpla == undefined ? "" : item.lgpla),//ubicacion
                            style: tableItem
						},{
							text: item.matnr,//MATERIAL
                            style: tableItem
						},{
							text: item.matnrD,//DESCRIPCION
                            style: tableItem
						}, {
                            text: item.meins,//UMB
                            style: tableItem
                        }, {
                            text: item.countedCost,//Costo Contado
                            style: tableItem
                        }, {
                            text: item.theoricCost,//Costo Teórico
                            style: tableItem
                        }, {
                            text: item.diffCost,//Diferencia en Valor en UMB
                            style: tableItem
                        }, {
                            text: percentDiff + "%",//Diferencia Porcentual
                            style: tableItem
                        },{
                            text: "$ " +item.costByUnit,//
                             style: tableItem
                        },{
                            text: justVal,
                            style: tableItem
                        },{
                            text: percJust,
                            style: tableItem
                        },{
                            text: justCon,
                            style: tableItem
                        }
                      
                        //  {
                        //     text: (item.note != undefined ? item.note : "N/A" ),//
                        //     style: tableItem
                        // }, {
                        //     text: (item.prodDate != undefined ? item.prodDate : "N/A" ),//
                        //     style: tableItem
                        // }, {
                        //     text: counted,//
                        //     style: tableItem
                        // }, {
                        //     text: item.countedExpl,//
                        //     style: tableItem
                        // }, {
                        //     text: item.cVal,//
                        //     style: tableItem
                        // }, {
                        //     text: "$" +item.costByUnit,//
                        //     style: tableItem
                        // }, {
                        //     text: justCant,
                        //     style: tableItem
                        // }, {
                        //     text: justVal,
                        //     style: tableItem
                        // }, {
                        //     text: percJust,
                        //     style: tableItem
                        // }, {
                        //     text: justCon,
                        //     style: tableItem
                        // }
                    ];
						return ret;
				});

				// Encabezados de la tabla
                //Categoría
				mapArr.unshift(
						[{
							text: 'Almacén',
							style: 'tableHeader'
						}, {
							text: 'Ubicación',
							style: 'tableHeader'
						}, {
							text: 'Material',
							style: 'tableHeader'
						}, {
							text: 'Descripción',
							style: 'tableHeader'
						}, {
							text: 'UMB',
							style: 'tableHeader'
						}, {
							text: 'Costo Contado',
							style: 'tableHeader'
						}, {
							text: 'Costo Teórico',
							style: 'tableHeader'
						}, {
							text: 'Dif. Valor',
							style: 'tableHeader'
						}, {
							text: 'Dif. %',
							style: 'tableHeader'
						},{
							text: 'Precio Medio',
							style: 'tableHeader'						
                        }, {
							text: 'Costo Justificado',
							style: 'tableHeader'						
                        }, {
							text: 'Justificado %',
							style: 'tableHeader'						
                        }, {
							text: 'Resumen',
							style: 'tableHeader'						
                        }]
				);
				// Totales
				mapArr.push([
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""},
						{text: ""}

				]);
				return mapArr;
			};
			let createColumnFilter = function(key,value) {
				return ([
						{
						width: '20%',
						text: key,
						style: 'filterKey'
						},
						{
						width: '60%',
						text: value,
						style: 'filterValue'
						}]);
			}
			let docDefinition = {
				info: {
						title: tituloPdf,
						author: 'INVEWEB',
						subject: 'Inventarios ciclicos',
						producer: 'system-inveweb',
						creator: 'system-inveweb'
				},
				pageOrientation: 'landscape',
				content: [{
                        //alignment: 'justify',
                        columns: [
                            {
                                text: tituloPdf,
                                style: 'header',
                            },
                            {
                                
                                image: "data:image/png;base64,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",
                                width: 48, 
                                height: 48
                              },
                              {
                                
                                image: "data:image/png;base64,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", 
                                width: 48, 
                                height: 48
                              }
                            
                        ]
                    },
					{
					columns: createColumnFilter('Documento de Inventario:',that.byId('docInvIdByLgpla').getValue())
					},
					{
					columns: createColumnFilter('Sociedad:',that.byId('bukrsByLgpla').getValue())
					},
					{
					columns: createColumnFilter('Centro:',that.byId('werksByLgpla').getValue())
					},
                    {
                    columns: createColumnFilter('Almacenes:', almacenesContados)
                    },
					{
					columns: createColumnFilter('Fecha Creación:',that.byId('dStartByLgpla').getValue())
					},
                    {
                    columns: createColumnFilter('Fecha Cierre:',that.byId('dEndByLgpla').getValue())
                    },			
					{
					columns: createColumnFilter('Conciliado por:',that.byId('createdByLgpla').getValue())
					},	
                    {
                    columns: createColumnFilter('Contado por:',counter)
                    },		
					{
					columns: createColumnFilter('Tipo de Documento:',that.byId('typeByLgpla').getValue())
					},
                    {
                        columns:[
                            {
                                text: "Valor Inventario\n"+inventoryValue,
                                fontSize: 7,
                                margin: [0, 15, 0, 0]
                            },
                            {
                                text: "Valor Diferencia\n"+totDifComplete,
                                fontSize: 7,
                                margin: [0, 15, 0, 0]
                            },
                            {
                                text: "Porcentual %\n"+(percent2 == false ? 0 : percent2) + "%",
                                fontSize: 7,
                                margin: [0, 15, 0, 0]
                            }
                        ]
                    },			
					{
					table: {
						headerRows: 0,
						//       1    2   3   4   5   6   7   8  9   10  11  12  13  
                        widths: [28, 34, 30, 90, 20, 39, 39, 36, 36, 36, 36, 36, 80],
						body: createTableData()
					},
					layout: 'primaryLayout'
				}],
				footer: function(currentPage, pageCount) {
						return {text: currentPage.toString() + ' / ' + pageCount, alignment: 'center'};
				},
				styles: {
					header: {
						fontSize: 14,
						bold: true,
						margin: [0, 0, 0, 5]
					},
					filterKey: {
						fontSize: 9,
						bold: true,
					},
					filterValue: {
						fontSize: 7,
						bold: false,
					},
					tableHeader: {
						bold: true,
						fontSize: 7,
						color: 'black',
						margin: [0, 15, 0, 0]
					},
					tableItem: {
						bold: false,
						fontSize: 7,
						margin: [0, 0, 0, 0]
					}
				}
			};
			sap.ui.require(["thirdparty/pdfmake/build/vfs_fonts"], function(vfs_fonts){
				pdfMake.tableLayouts = {
					primaryLayout: {
						hLineWidth: function (i, node) {
						if (i === 0 || i === node.table.body.length) {
							return 0;
						}
						return (i === node.table.headerRows) ? 2 : 1;
						},
						vLineWidth: function (i) {
						return 0;
						},
						hLineColor: function (i) {
						return i === 1 ? 'black' : '#aaa';
						},
						paddingLeft: function (i) {
						return i === 0 ? 0 : 8;
						},
						paddingRight: function (i, node) {
						return (i === node.table.widths.length - 1) ? 0 : 8;
						}
					}
				};
            	pdfMake.createPdf(docDefinition).download("Conciliación_SAP_Financiero_Ubicación_DocInv_" + that.byId("docInvIdByLgpla").getValue()+".pdf");
			});
        },
        
        loadPDF_LGPLA_Report: function(){
            let financiera = this.byId("tbSHByLgpla").getPressed();
            if(financiera){
                this.downloadAccountant_LGPLA_COST_Pdf();
            }else{
                this.downloadAccountant_LGPLA_Pdf();
            }
            
        },
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        downloadReport : function() {
            console.log("Reporte Lgpla");
            let data = this.row;
            
            if (data == undefined || data.length == 0) {
                
                this.toast("Nada que exportar...", "20em");
                return;
            }
    
            let sumDif = 0;
            let totDif = 0;
            let totDifComplete = 0;
            let diffPercent = 0;
            let itemsCounted = 0;
            let inventoryValue = 0;
            let percent1;
            let percent2;
            let contado = 0;
            let zeroDiffCounted = 0;
            let difPercWellCount = 0;
            
            for (let i = 0; i < data.length; i++) {
            
                totDifComplete += (parseFloat(data[i].diff.replace(/,/g, "")) * parseFloat(data[i].costByUnit));
                if(data[i].lgpla != undefined && data[i].lgpla.length > 0){
                    
                    if(parseFloat(data[i].diff.replace(/,/g, "")) != 0){
                        sumDif++;
                    }
                    
                    itemsCounted ++;
                }
                totDif += (parseFloat(data[i].diff.replace(/,/g, "")) * parseFloat(data[i].costByUnit));
                let couCo = data[i].theoricCost.replace(/,/g, "");
                couCo = couCo.replace(/\$/g, "");
                inventoryValue += (parseFloat(couCo));
                
                contado++;
                if(parseFloat(data[i].diff.replace(/,/g, "")) == 0){
                    zeroDiffCounted++;
                }
            }
            
            percent1 = ((parseFloat(sumDif / itemsCounted) * 100).toFixed(3));
            
            if(isNaN(percent1)){
                percent1 = "N/A"
            }else{
                if(percent1 > 100){
                    percent1 = 100
                }else if(percent1 < -100){
                    percent1 = -100
                }
                percent1 +="%"
            }
            
            
            percent2 = ((parseFloat(totDifComplete / inventoryValue) * 100).toFixed(3));
            
            if(percent2 > 100){
                percent2 = 100
            }else if(percent2 < -100){
                percent2 = -100
            }	
            
            difPercWellCount = ((parseFloat(zeroDiffCounted / contado) * 100).toFixed(3));
            difPercWellCount = (isFinite(difPercWellCount) == false ? 0 : difPercWellCount);
            
            inventoryValue = "$"+inventoryValue;
            
            totDifComplete = "$"+totDifComplete;
            
            let report = "";
            report += "Documento de Inventario:," + this.byId("docInvIdByLgpla").getValue();
            report += ",,,,Ubicaciones Existentes Contadas, Con Diferencia, Porcentual" + "\r\n";
            report += "Sociedad:," + this.byId("bukrsByLgpla").getValue();
            report += ",,,," + itemsCounted + "," + sumDif + "," + (percent1 == false ? 0 : percent1) + "\r\n";
            report += "Centro:," + this.byId("werksByLgpla").getValue();
            report += ",,,,Valor Inventario en SAP, Valor Diferencia, Porcentual" + "\r\n";
            report += "Fecha de Creación:," + this.byId("dStartByLgpla").getValue();
            report += ",,,," + inventoryValue + "," + totDifComplete + "," + (percent2 == false ? 0 : percent2) + "%\r\n";
            report += "Fecha de Conciliación:," + this.byId("dEndByLgpla").getValue();
            report += ",,,Ubicaciones Contadas, Ubicaciones Correctas, Diferencia Porcentual" + "\r\n";
    //		report += "Ruta:," + this.byId("routeIdByLgpla").getValue();
            report += ",,,,"+ contado + "," + zeroDiffCounted + "," +difPercWellCount+ "%\r\n";
            report += "Tipo de Documento:," + this.byId("typeByLgpla").getValue() + "\r\n";
            report += "\r\n";
            report += "Almacén, Ubicación, Material, Descripción, UMB, Tarimas Contadas, Armado, Total Contado, Contado Teórico, Diferencia en Cantidad en UMB, ";
            report += "Costo Contado, Costo Teórico, Diferencia en Valor en UMB, Diferencia Porcentual, Fecha Inicio, Fecha fin, "; 
            report += "Notas, Fecha Producción, Contado, Contado Explosionado, Clase de Valoración, ";
            report += "Precio Medio, Cantidad Justificada, Costo Justificado, Justificación \r\n ";
    
            for (let i = 0; i < data.length; i++) {
                
                report += data[i].lgort + ","
                report += (data[i].lgpla == undefined ? "" : data[i].lgpla) + ","
                report += data[i].matnr + ","
                report += data[i].matnrD.replace(/,/g, "") + ","
                report += data[i].meins + ","
                report += (data[i].vhilmCounted == undefined ? "0" : data[i].vhilmCounted) + "," //Tarimas Contadas
                report += (data[i].build != undefined ? data[i].build : "N/A") + "," //Armado
                report += data[i].countedTot.replace(/,/g, "") + "," //Total Contado
                report += data[i].theoric.replace(/,/g, "") + "," //Contado Teórico
                report += data[i].diff.replace(/,/g, "") + "," //Diferencia en Cantidad en UMB
                report += data[i].countedCost.replace(/,/g, "") + "," //Costo Contado
                report += data[i].theoricCost.replace(/,/g, "") + "," //Costo Teórico
                report += data[i].diffCost.replace(/,/g, "") + "," //Diferencia en Valor en UMB
                let counted = (parseFloat(data[i].counted.replace(/,/g, "")) + parseFloat(data[i].countedExpl.replace(/,/g, "")))
                
                let difference = parseFloat(data[i].diff.replace(/,/g, ""));
                let percentDiff = "";
                
                if(difference == 0 || counted == 0){
                    percentDiff = 0
                }else{
                    percentDiff = ((difference / counted).toFixed(2) * 100);
                    percentDiff = (isFinite(percentDiff) == false ? 0 :  percentDiff);
                }
                 
                percentDiff = Math.abs(percentDiff) > 100? 100: percentDiff;
    
                report += percentDiff + "%,"; //Diferencia Porcentual
                if(data[i].dateIniCounted != undefined && data[i].dateIniCounted > 0){
                    report += this.formatDate(new Date(data[i].dateIniCounted))+ ","
                }else{
                    report += "N/A,"
                }
                
                if(data[i].dateEndCounted != undefined && data[i].dateEndCounted > 0){
                    report += this.formatDate(new Date(data[i].dateEndCounted))+ ","
                }else{
                    report += "N/A,"
                }
                
                report += (data[i].note != undefined ? data[i].note : "N/A" )+ ","
                report += (data[i].prodDate != undefined ? data[i].prodDate : "N/A" )+ ","
                report += counted + "," // Inventario físico
                report += data[i].countedExpl.replace(/,/g, "") + ","
                report += data[i].cVal + ","
                report += "$" + data[i].costByUnit + ","
                //////////////////////////Ingresando justificaciones para Ubicacion
                let totJsQuant = 0;
                let quant;
    
                let jsConcat = "";
                
                for (let j = 0; j < data[i].lsJustification.length; j++) {
                    quant = data[i].lsJustification[j].quantity.replace(/,/g, "");
                    quant = parseFloat(quant)
                    totJsQuant += parseFloat(quant);
                    jsConcat += "(" + data[i].lsJustification[j].quantity.replace(/,/g, "") + " ; "
                    jsConcat += data[i].lsJustification[j].justify + "); ";				
                }
                
                report += totJsQuant + "," //Justificación Cantidad
                report += "$" + (totJsQuant * parseFloat(data[i].costByUnit))	+ "," //Justificación Valor
                
                let percentJs = "";
                let diffJs = parseFloat(data[i].countedTot.replace(/,/g, "")) - parseFloat(data[i].theoric.replace(/,/g, ""));
                
                if(totJsQuant == 0){
                    percentJs = 0;				
                }else{				
                    if(diffJs == 0 && totJsQuant > 0){
                        percentJs = 100;
                    }else{
                        percentJs = Math.abs((totJsQuant / diffJs).toFixed(2) * 100);
                    }
                            
                }
                
                report += percentJs + "%,"	//Justificación Porcentual		"
                report += "Justificación: " + jsConcat + ",";
                report += "\r\n";
            }
    
            let textFileAsBlob = new Blob([ "\ufeff", report ], {
                type : 'text/plain;charset=ISO-8859-1',
                encoding : "ISO-8859-1"
            });
    
            let fileNameToSaveAs = "Conciliación_SAP_Ubicación_DocInv_" + this.byId("docInvIdByLgpla").getValue() + '.csv';
            let downloadLink = document.createElement("a");
            downloadLink.download = fileNameToSaveAs;
            // downloadLink.innerHTML = "File to download";
            if (window.webkitURL != null) {
                // Chrome allows the link to be clicked without
                // actually adding it to the DOM.
                downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
            } else {
                // Firefox requires the link to be added to the DOM
                // before it can be clicked.
                downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                downloadLink.onclick = destroyClickedElement;
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
            }
            
            downloadLink.click();
    
        },

        hideFinancialColumnsLgpla: function(){
            this.byId("cCountedCostByLgpla").setVisible(false);
            this.byId("cTheoricCostByLgpla").setVisible(false);
            this.byId("cDiffCostByLgpla").setVisible(false);
        },
        
        showFinancialColumnsLgpla: function(){
            this.byId("cCountedCostByLgpla").setVisible(true);
            this.byId("cTheoricCostByLgpla").setVisible(true);
            this.byId("cDiffCostByLgpla").setVisible(true);
        },

        generateDialogTableLgpla: function(){
        
            let dialogTable = new Table("oTableDialog",{
                sticky:["ColumnHeaders","HeaderToolbar"],
                fixedLayout:false,
                mode:"SingleSelectMaster",
                selectionChange:function(oEvent){
                    this.selectDocumentLgpla(oEvent);
                }.bind(this),
                headerToolbar: new Toolbar("dialogToolbar",{
                        content: [new SearchField("fSearchLgpla",{
                            width:"15rem",
                            search: function(oEvent){
                                this.loadDocInvLgpla(oEvent);
                            }.bind(this)
                        }),	
                                    new Button("bClean",{
                                        icon:"sap-icon://eraser",
                                        tooltip:"Borrar",
                                        press:function(){
                                            this.cleanOdialogLgpla();
                                        }.bind(this)
                                    }),
                                    new Button({
                                        icon:"sap-icon://clear-filter",
                                        tooltip:"Limpiar Filtros de la Tabla",
                                        press: function(oEvent){
                                            this.clearTableDialog();
                                        }.bind(this)
                                    })
                            ]
                      })} );
            
            dialogTable.addColumn(new Column("cId",{}).setHeader(new ObjectIdentifier({title: "Id Doc."})));
            dialogTable.addColumn(new Column("cDesc",{}).setHeader(new ObjectIdentifier({title: "Descripción"})));
            dialogTable.addColumn(new Column("cWerks",{}).setHeader(new ObjectIdentifier({title: "Centro"})));
            dialogTable.addColumn(new Column("cCreatedDate",{}).setHeader(new ObjectIdentifier({title: "Fecha de Creación"})));
            dialogTable.addColumn(new Column("cCreatedBy",{}).setHeader(new ObjectIdentifier({title: "Creado por"})));

            let oTemplate = new ColumnListItem({

                cells: [
                new Text({ text: "{oModelTableDialogLgpla>id}",tooltip:"{id}"}),
                new Text({ text: "{oModelTableDialogLgpla>desc}",tooltip:"{desc}" }),
                new Text({ text: "{oModelTableDialogLgpla>werks}",tooltip:"{werks}" }),
                new Text({ text: "{oModelTableDialogLgpla>createdDate}",tooltip:"{createdDate}"}),
                new Text({ text: "{oModelTableDialogLgpla>createdBy}",tooltip:"{createdBy}"}),
                ]
                
                });

                dialogTable.bindItems("oModelTableDialogLgpla>/",oTemplate);
            
            return dialogTable;
        },

        cleanOdialogLgpla: function(){
            
            let fSearch = sap.ui.getCore().byId("fSearchLgpla");
            fSearch.setValue("");				
            let oTable = sap.ui.getCore().byId("oTableDialog");	
            oTable.setModel(new JSONModel([]),"oModelTableDialogLgpla");
        },

        selectDocumentLgpla: function(oEvent){
            BusyIndicator.show(0);
            this.disableInputLgpla();
            let oTable = sap.ui.getCore().byId("oTableDialog");
            let docId = sap.ui.getCore().byId(oEvent.getParameters().id).getSelectedItems()[0].getCells()[0].getText();
            let modelData = oTable.getModel("oModelTableDialogLgpla").getData();
            let row;
            for(let i in modelData){
                if(docId == modelData[i].id){
                    row = modelData[i];
                    break;
                }
            }
            
            if(!row.available){
                MessageBox.warning('Extrayendo información de SAP, intente más tarde.',
                        MessageBox.Icon.WARNING, "Advertencia");
                oTable.removeSelections(true);
                BusyIndicator.hide();
                this.loadDocInvLgpla();
                return;
            }
            this.currentRecordRow = row;
            this.loadDocLgplaInfo(row);
        },

        showMCDocInvAux : function(evt) {
    
            //		this.eraseNotification();
                    
                    if (!this.oDialogMCDocInvLgpla) {
            
                        this.oDialogMCDocInvLgpla = new Dialog({
                            id : 'oDialogMCDocAux', // ID
                            title : "Seleccionar Documento de Inventario", // string
                            contentWidth : "55%", // CSSSize,
                            content : [ this.generateDialogTableLgpla() ], // Control
                            beginButton : new Button({
                                    text : 'Cerrar',
                                    press : function() {
                                    this.oDialogMCDocInvLgpla.close();
                                }.bind(this)
                            })
                        });
                    }
                    this.cleanOdialogLgpla();
                    this.oDialogMCDocInvLgpla.open();
                },

        loadDocInvLgpla: async function(oEvent){

            if(oEvent != undefined){
                let clear = oEvent.getParameters().clearButtonPressed;
                
                if(clear){
                    this.cleanOdialogLgpla();
                    return;
                }
            }
                    
            let oModel = new JSONModel([]);			
            let oTable = sap.ui.getCore().byId("oTableDialog");
            oTable.setModel(oModel,"oModelTableDialogLgpla");
            let search = sap.ui.getCore().byId("fSearchLgpla").getValue();
            
            if(search.trim().length > 0 && isNaN(search)){
                 MessageBox.show('El formato del Id es iválido.',
                        MessageBox.Icon.ERROR, "Error");
            }		
            
            let bukrs = null;
            let werks = null;
            this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
            if(!this.ADMIN_ROLE){
                bukrs = this.getBukrs();
                werks = this.getWerks();
            }
            let docInvBean = new Object();
            docInvBean.bukrs = bukrs;
            docInvBean.werks = werks;
            docInvBean.docInvId = (search.trim().length == 0? null: search); 	

            const request = {
                tokenObject: null,
                lsObject: docInvBean
            };

            let json = await this.execService(InveServices.GET_CLOSED_CONCILIATIONS_ID,request,"getClosedConciliationsID",this.showLog);
              
            if(json){
                for(let i=0; i< json.lsObject.length; i++){
                    json.lsObject[i].idAux = parseInt(json.lsObject[i].id);
                }
                //Create a model and bind the table rows to this model  	            		            		
                oTable.setModel(new JSONModel(json.lsObject),"oModelTableDialogLgpla");
                BusyIndicator.hide();
            }
    
        },
        loadDocLgplaInfo: async function(record){
                            
            let bukrs = null;
            let werks = null;
            
            this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
            
            if(!this.ADMIN_ROLE){
                
                bukrs = this.getBukrs();
                werks = this.getWerks();
            }
            
            let docInvBean = new Object();
            docInvBean.bukrs = bukrs;
            docInvBean.werks = werks;		
            docInvBean.docInvId = record.id;
            docInvBean.status = record.status;
            
            this.backupObjectDocBean = docInvBean;		
            
            const request = {
                tokenObject: null,
                lsObject: docInvBean
            };

            let json = await this.execService(InveServices.GET_REPORTE_DOC_INV_BY_LGPLA,request,"getReporteDocInvByLgpla",this.showLog);
              
            if(json){
                this.docInvRec = json.lsObject; //guardado de bean para reconteo
                // Limpiando los checks de conciliacion elegida para cargar el nuevo documento
                this.byId('chkWerks').setState(false); 
                this.byId('chkLgpla').setState(false);
                
                this.activeDocInvId = docInvBean.docInvId;//guardar el id del documento activo al momento
                
                this.lgplaEmpty = false;
                console.log("data from back report lgpla ",json.lsObject);
                if(json.lsObject.sapRecount){
                    
                    this.byId('matExplByLgpla').setEnabled(false);
                    
                }else{
                    
                    this.byId('matExplByLgpla').setEnabled(true);
                }
                
                this.setSavedConciType(json.lsObject.conciType);
                if(json.lsObject.status == "4"){
                    this.byId("bCount").setEnabled(false);
                    this.byId("bSave").setEnabled(false);
                    this.byId("bPartialSave").setEnabled(false);
                    this.byId('chkLgpla').setEnabled(false);// already selected conci
                    this.byId("cISC").setVisible(false);
                    this.byId('btn_Report_LGPLA_PDF').setEnabled(true);//closed document  and can download pdf
                    this.byId('btn_Report_PDF').setEnabled(true);
                }else{
                    this.byId("bCount").setEnabled(true);
                    this.byId("bSave").setEnabled(true);	
                    this.byId("bPartialSave").setEnabled(true);
                    this.byId("cISC").setVisible(true);
                    this.byId('btn_Report_LGPLA_PDF').setEnabled(false);//open document  and cannot download pdf
                    this.byId('btn_Report_PDF').setEnabled(false);
                    
                    if(json.lsObject.conciType != undefined){
                        this.byId('chkLgpla').setEnabled(false);// already selected conci
                    }else{
                        this.byId('chkLgpla').setEnabled(true);// not yet selected conci
                    }
                }
                
                //Create a model and bind the table rows to this model
                let oTable = this.byId("oTableByLgpla");
                    let oModelEmptyByLgpla = new JSONModel([]);
                    oTable.setModel(oModelEmptyByLgpla,"oModelLgpla");
                
                let row = json.lsObject.docInvPosition;
                row = this.copyObjToNew(row);
                console.log("Revisa pos de lgpla", row);
                
                try {
                                                
                    for(let i = 0; i < row.length; i++){
                        
                        row[i].item = i + 1;
                                                
                        if(row[i].theoric == undefined){
                            row[i].theoric = 0;
                        }
                        
                        
                        if(parseFloat(row[i].diff) != 0){
                            row[i].isc = true;
                        }else{
                            row[i].isc = false;
                        }
                        
                        row[i].theoricAux = parseFloat(row[i].theoric);
                        
                        row[i].theoric = this.formatNumber(row[i].theoric);
                        
                        row[i].diffByLgpla = parseFloat(row[i].diff);
                        
                        row[i].diff = this.formatNumber(parseFloat(row[i].diff));    
                        
                        this.backUpDiffLgpla.push(row[i].diff);//por si cancelan la justificacion
                        
                        row[i].counted = this.formatNumber(row[i].counted);
                        
                        row[i].countedExpl = this.formatNumber(row[i].countedExpl);
                                                    
                        row[i].countedTot = this.formatNumber(row[i].countedTot);            				                			
                                                        
                        //Formatting financial columns 
                        row[i].theoricCostAux = parseFloat(row[i].theoricCost);            				
                                                    
                        row[i].theoricCost = "$" + this.formatNumber(row[i].theoricCost);
                        
                        row[i].countedCostByLgpla = parseFloat(row[i].theoricCost);
                        
                        row[i].countedCost = "$" + this.formatNumber(row[i].countedCost);
                        
                        row[i].diffCostByLgpla = parseFloat(row[i].diffCost);
                        
                        row[i].diffCost = "$" + this.formatNumber(row[i].diffCost);
                                                        
                    }
                                                
                } catch (e) {
                    console.error(e);    						    						
                }    					    					    					
                
                this.row = row;
                this.quantityLgpla = row;     //despues del formateo lo llevamos al controller pa ser usado porjustifyLgpla      		
                try {
                    this.byId("docInvIdByLgpla").setValue(json.lsObject.docInvId);
                    console.log("docInvIdByLgpla",json.lsObject.docInvId);
                } catch (e) {
                    console.warn(e);
                }
                
                try {
                    this.byId('bukrsByLgpla').setValue(json.lsObject.bukrs + " - " + json.lsObject.bukrsD);
                } catch (e) {
                    console.warn(e);
                }
                
                try {
                    this.byId('werksByLgpla').setValue(json.lsObject.werks + " - " + json.lsObject.werksD);
                } catch (e) {
                    console.warn(e);
                }
                
                try {
                    this.byId('dStartByLgpla').setValue(json.lsObject.creationDate);
                } catch (e) {
                    console.warn(e);
                }
                
                try {
                    this.byId('dEndByLgpla').setValue(json.lsObject.conciliationDate);
                } catch (e) {
                    console.warn(e);
                }

                
                try {
                    
                    if(json.lsObject.type == 1){
                        this.byId('typeByLgpla').setValue("Diario");
                    }else{
                        this.byId('typeByLgpla').setValue("Mensual");
                    }
                } catch (e) {
                    console.warn(e);
                }
                
                try{

                    this.byId('createdByLgpla').setValue(json.lsObject.createdBy);
                } catch(e){
                    console.warn(e);
                }
                
                try {
                    if(row != undefined && row.length > 0 && json.lsObject.status != "4"){
                        this.byId("bUploadByLgpla").setEnabled(true);
                    }else{
                        this.byId("bUploadByLgpla").setEnabled(false);
                    }               		
                    let oModelPotisions = new JSONModel(row);
                    
                    
                    oTable.setModel(oModelPotisions,"oModelLgpla");
                    
                    //Clean the Expl by lgpla
                    //this.cleanView(); APUNTAR A EXPL BY LPGPLA 270921 1752 HRS
                                                                                
                } catch (e) {
                    console.warn(e);
                }
            if(this.oDialogMCDocInvLgpla != undefined){
                this.oDialogMCDocInvLgpla.close();
            }
            BusyIndicator.hide();
            }
        },

        disableInputLgpla : function() {
    
            setTimeout(function() {
                
                $("#container-inveweb---vConsSap--docInvIdByLgpla-inner").attr("readonly",	"readonly");
            }, 100);
        },
        
        loadJustifyLgpla : function(oEvent) {
    
            this.eraseNotification();
            let item = sap.ui.getCore().byId(oEvent.getParameters().id).getCells()[0].getText();
            let modelData = this.byId("oTableByLgpla").getModel("oModelLgpla").getData();
            let row;
            for(let i in modelData){
                if(item == modelData[i].item){
                    row = modelData[i];
                    break;
                }
            }
            this.eraseNotification();
            this.rowJustify = row;
            console.log("loadJustifyLgpla rowJustify",this.rowJustify);
            this.navTo("vJustifyLgpla");

        },

        resetDiffLgpla: function(){
            let oTableModelData = this.byId("oTableByLgpla").getModel("oModelLgpla").getData();
            let arrDiff = this.backUpDiffLgpla;
            
            if(oTableModelData.length > 0 && arrDiff.length > 0 && oTableModelData.length == arrDiff.length){
                
                for(let i in oTableModelData){
                    oTableModelData[i].diff = arrDiff[i];
                }
                this.byId("oTableByLgpla").getModel("oModelLgpla").refresh(true);
                console.log("Diferencias restauradas");
            }else{
                console.error("No coinciden los arreglos de oTableModelData y arrDiff", oTableModelData,arrDiff );
            }
            
        },

        uploadTemplateLgpla: function(){
            let message;
            this.eraseNotification();
            if(this.validateConciType()){
                $('#fileConcLgpla').val("");
    
                MessageBox.show('Debe de elegir un tipo de conciliación para poder justificar',
                                                    MessageBox.Icon.WARNING,
                                                    "Falta información");
                
                return;
            }
    
            let that = this;
            let file = $('#fileConcLgpla').prop('files')[0];
            let allowedFiles = [ 'csv' ];
            let ext = file.name.split('.').pop().toLowerCase();
            
            // Check if is an allowed file
            if (allowedFiles.indexOf(ext) == -1) {
                this.toast("Tipo de archivo no permitido, "
                        + "solo se permiten archivos de tipo: "
                        + allowedFiles, '20em');
                $('#fileConcLgpla').val("");
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
    
                if (allTextLines[size - 1].indexOf(",") == -1) {
                    allTextLines.splice(-1);
                }
    
                BusyIndicator.show();
    
                for (let i = 1; i < allTextLines.length; i++) {
    
                    data = allTextLines[i].split(',');
                    
                    if(data[0] == undefined || data[0].length == 0){
                        BusyIndicator.hide();
                        message = 'Dato no válido para "Almacén" en la linea: ' + (i + 1);
                        that.message(message, MessageType.Error,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pConciliation"));
    
                        return;
                    }
                    
                    if (isNaN(data[2])) {
    
                        BusyIndicator.hide();
                        message = 'Dato no válido para "Material" en la linea: ' + (i + 1);
                        that.message(message, MessageType.Error,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pConciliation"));
    
                        return;
                    }
    
                    if (isNaN(data[3])) {
                        
                        BusyIndicator.hide();
                        message = 'Dato no válido para "Cantidad" en la linea: ' + (i + 1);
                        that.message(message, MessageType.Error,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pConciliation"));
    
                        return;
                    }
    
                    if (isNaN(data[4])) {
    
                        BusyIndicator.hide();
                        message = 'Dato no válido para "Justificación Id" en la linea: ' + (i + 1);
                        that.message(message, MessageType.Error,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pConciliation"));
                        
                        return;
                    }
    
                    let found = false;
                    let justify;
    
                    for (let j = 0; j < that.lsJustifies.length; j++) {
    
                        if (that.lsJustifies[j].jsId == data[4]) {
    
                            justify = data[4] + ' - ' + that.lsJustifies[j].justification;
                            found = true;
                            break;
                        }
                    }
    
                    if (!found) {
    
                        BusyIndicator.hide();
                        message = '"Justificación Id" no válido en la linea: '	+ (i + 1);
                        that.message(message, MessageType.Error,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pConciliation"));
    
                        return;
                    }
    
                    let object = new Object();
                    object.item = data[2].trim();
                    object.quantity = data[3].trim();
                    object.jsId = data[4].trim();
                    try {
                        object.jsDescription = data[5];
                    } catch (e) {
                        console.warn("No description for material: " + data[2]);
                    }				 
                    object.justify = justify;
    
                    let objectID = -1;
                    for(; objectID < that.quantityLgpla.length; objectID++){
                        if(that.quantityLgpla[objectID]!=undefined){
                            if(that.quantityLgpla[objectID].lgpla != undefined){
                                if(that.quantityLgpla[objectID].matnr == data[2]
                                && that.quantityLgpla[objectID].lgort == data[0]
                                    && that.isEqualLgpla(that.quantityLgpla[objectID].lgpla, data[1])){
                                break;
                                }
                            }else{
                                if(that.quantityLgpla[objectID].matnr == data[2]
                                && that.quantityLgpla[objectID].lgort == data[0]){
                                break;
                                }
                            }
                            
                        }
                    }
                    
                    if(objectID != -1 && that.quantityLgpla[objectID] != undefined){
                        let lsJustification;
        
                        if (that.quantityLgpla[objectID].lsJustification == undefined) {
                            
                            lsJustification = [];
                            lsJustification.push(object);
                            that.quantityLgpla[objectID].lsJustification = lsJustification;
    
                            
                        } else {
                            
                            that.quantityLgpla[objectID].lsJustification.push(object);
    
                        }
                    } else {
                        console.warn('"Material" no encontrado para justificacion: ' + data[2]);
                    }
    
                }
    
                // Update the models
                for (let i = 0; i < that.quantityLgpla.length; i++) {
    
                    let sumQuantityUMB = 0;
                    
                    // Get the quantity per justification
                    for (let j = 0; j < that.quantityLgpla[i].lsJustification.length; j++) {
    
                        sumQuantityUMB += parseFloat(that.quantityLgpla[i].lsJustification[j].quantity.replace(/,/g, ""));
                    }
    
                    // Update the quantity model
                    let counted = that.quantityLgpla[i].countedTot.replace(/,/g, "");
                    let theoric = that.quantityLgpla[i].theoric.replace(/,/g, "");
                    that.quantityLgpla[i].diff = new Intl.NumberFormat("en-US", {minimumFractionDigits : '2'
                                            }).format((sumQuantityUMB + parseFloat(counted))- parseFloat(theoric));
                    
                    if (that.quantityLgpla[i].diff.replace(/,/g, "") == 0){
                        that.quantityLgpla[i].isc = false;
                    }
    
   
                    
                }
    
                let oModel; 
                let oTable = that.byId('oTableByLgpla');
                let flg = that.byId("tbSHByLgpla").getPressed();
    
                if (!flg) {
                    oModel = new JSONModel(that.quantityLgpla);		
                }
    
                oTable.setModel(oModel,"oModelLgpla");
    
                message = 'Carga concluida con éxito.';
                that.message(message, MessageType.Success,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pConciliation"));
    
                setTimeout(function() {
                    that.byId("messagesBox").getItems()[0].close();
                }, 5000);
    
                BusyIndicator.hide();
    
            }
    
            function errorHandler(evt) {
    
                if (evt.target.error.name == "NotReadableError") {
                        MessageBox.show('No se puede leer el archivo.',
                                            MessageBox.Icon.ERROR, "Error al cargar el archivo");
                }
    
            }
    
            $('#fileConcLgpla').val("");
        
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

        openFilePickerLgpla : function() {
    
            $('#fileConcLgpla').click();
        },

        downloadTemplateLgpla : function() {
    
            let link = document.createElement("a");
            link.href = InveTemplates.JUSTIFICATIONS_LGPLA;
            link.click();
        },

        checkConciLgpla: function(){
            if(this.byId("chkLgpla").getState()){
                console.log("conci por Ubicacion activa");
                this.byId('chkWerks').setState(false);
                this.setSavedConciType("lgpla");
            }else{
                this.setSavedConciType("");
            }
        },

         //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////FUNCIONES DEL CONTROLADOR DE VMATEXPLBYLGPLA///////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    cleanViewMatExplByLgpla: function(){
            
        // Reset the Explosion tab
        setTimeout(function() {
           
            let oModel = new JSONModel([]);

            let oTable = this.byId("oTableExplRepByLgpla");
            oTable.setModel(oModel,"oModelMatExplLgpla");

        }.bind(this),100);
    },

    downlMatnrExplMatExplByLgpla: function(oEvent){
        
        let oTable = this.byId("oTableExplRepByLgpla");		
        let modelData;
        
        try {
            modelData = oTable.getModel("oModelMatExplLgpla").getData();
        } catch (e) {
            modelData = [];
        }
        
        if(modelData.length == 0){
            this.toast("Nada que exportar...", "20em");
            return;
        }
        
        let report="";
        //Set the header
        report += "Documento de Inventario:," + this.byId("docInvIdByLgpla").getValue() + "\r\n";
        report += "Tipo:," + this.byId("typeByLgpla").getValue() + "\r\n";
        report += "Fecha de cierre:," + this.byId("dEndByLgpla").getValue() + "\r\n";
        report += "Sociedad:," + this.byId("bukrsByLgpla").getValue() + "\r\n";
        report += "Centro:," + this.byId("werksByLgpla").getValue() + "\r\n";		
        report += "\r\n";
        report += "Item, Almacén, Tipo, Ubicación, Material, Descripción, Categoría, UMB, Contado, ";
        report += "Material Explosionado, Descripción, Almacén de Explosionado, UMB, Cantidad" + "\r\n";
        
        //Set the body report
        for(let i = 0; i < modelData.length; i ++){
            
            report += modelData[i].item + ","
            report += modelData[i].lgort + ","
            report += modelData[i].lgtyp + ","
            report += modelData[i].lgpla + ","
            report += modelData[i].matnr + ","
            report += modelData[i].description + ","
            report += modelData[i].category +",";
            report += modelData[i].umb + ","
            report += modelData[i].counted.replace(/,/g,"") + ","
            
            if(modelData[i].matnrExpl != undefined){
            
                report += modelData[i].matnrExpl + ","
                report += modelData[i].descMantrExpl + ","
                report += modelData[i].lgortExpl + ","
                report += modelData[i].umbExpl + ","
                report += modelData[i].quantity.replace(/,/g,"") + ","
            }
                                    
            report += "\r\n";
        }
        
        let textFileAsBlob = new Blob(["\ufeff", report ], {  
            type: 'text/plain;charset=ISO-8859-1', 
            encoding: "ISO-8859-1"});
        
        let fileNameToSaveAs = "Explosion_Material_DocInv_" + this.byId("docInvIdByLgpla").getValue() + '.csv';		
        let downloadLink = document.createElement("a");
        downloadLink.download = fileNameToSaveAs;
        
        if (window.webkitURL != null) {
          // Chrome allows the link to be clicked without actually adding it to the DOM.
          downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
        } else {
          // Firefox requires the link to be added to the DOM before it can be clicked.
          downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
          downloadLink.onclick = destroyClickedElement;
          downloadLink.style.display = "none";
          document.body.appendChild(downloadLink);
        }
        downloadLink.click();
    },
    
    loadReportMatExplByLgpla: async function(){
        let table;         
        const request = {
            tokenObject : null,
            lsObject :  this.byId("docInvIdByLgpla").getValue()
        }
        ;
        const json = await this.execService(InveServices.GET_EXPLOSION_REPORT_BY_LGPLA,request,"getExplosionReportByLgpla",this.showLog);

        if(json){
            //Create a model and bind the table rows to this model            		
            table = json.lsObject;
            let modelDataConSAP;
            
            try {
                modelDataConSAP =  this.quantityLgpla;//cambio de quantity a quaintityLgpla
            } catch (e) {
                modelDataConSAP = [];
            }
                                                    
            for(let i = 0; i < modelDataConSAP.length; i++){
                                        
                for(let j = 0; j < table.length; j++){
                    
                    if(table[j].matnr == modelDataConSAP[i].matnr){
                        
                        table[j].description = modelDataConSAP[i].matnrD;
                        table[j].category = modelDataConSAP[i].category;
                        table[j].umb = modelDataConSAP[i].meins;
                        table[j].counted = modelDataConSAP[i].counted.replace(/,/g,"");            			            					
                    }
                }            			            			
            }            		
            
            let item = 1;
            for(let i = 0; i < table.length; i++){
                
                if(table[i].matnrExpl.length == 0){
                    
                    table[i].matnrExpl = "-";
                    table[i].descMantrExpl = "-";            				            				
                    table[i].umbExpl = "-";
                    table[i].lgortExpl = "-";
                    table[i].quantity = "-";
                }
                                        
                table[i].item = item.toString();            		
                
                table[i].counted = this.formatNumber(table[i].counted);
                
                table[i].countedAux = parseFloat(table[i].counted.replace(/,/g,""));   
                
                if(table[i].quantity != '-'){
                    
                    table[i].quantity = this.formatNumber(table[i].quantity);
                    
                    table[i].quantityAux = parseFloat(table[i].quantity.replace(/,/g,""));
                }else{
                    
                    table[i].quantityAux = 0;
                }
                
                if(i < (table.length + 1)){
                    try {
                        
                        if(table[i].matnr != table[i + 1].matnr){
                            item ++;
                        }	
                    } catch (e) {
                        console.warn(e);
                    }
                }
            }                
        }
        
        let oModel = new JSONModel(table);
        
        let oTable = this.byId("oTableExplRepByLgpla");
        oTable.setModel(oModel,"oModelMatExplLgpla");
        
        BusyIndicator.hide();
    },
    
    saveReportExplLgpla: async function(){
        
        if(this.quantityLgpla == undefined){
            console.log("Sin datos en quantityLgpla para obtrener explosionado por Ubicacion");
            return;
        }
        
        const request = {
            tokenObject : null,
            lsObject : this.currentDocInvId
        }
        
        let table;

        const json = await this.execService(InveServices.GET_EXPLOSION_REPORT_BY_LGPLA,request,"getExplosionReportByLgpla",this.showLog);

        if(json){
            //Create a model and bind the table rows to this model            		
            table = json.lsObject;
            console.log("expl_Lgpla json",table);
            let modelDataConSAP;
            
            try {
                modelDataConSAP =  this.quantityLgpla;//cambio a lgpla
            } catch (e) {
                modelDataConSAP = [];
            }
                                                    
            for(let i = 0; i < modelDataConSAP.length; i++){
                                        
                for(let j = 0; j < table.length; j++){
                    
                    if(table[j].matnr == modelDataConSAP[i].matnr){
                        
                        table[j].description = modelDataConSAP[i].matnrD;
                        table[j].category = modelDataConSAP[i].category;
                        table[j].umb = modelDataConSAP[i].meins;
                        table[j].counted = modelDataConSAP[i].counted.replace(/,/g,"");            			            					
                    }
                }            			            			
            }            		
            
            let item = 1;
            for(let i = 0; i < table.length; i++){
                
                if(table[i].matnrExpl.length == 0){
                    
                    table[i].matnrExpl = "-";
                    table[i].descMantrExpl = "-";            				            				
                    table[i].umbExpl = "-";
                    table[i].lgortExpl = "-";
                    table[i].quantity = "-";
                }
                                        
                table[i].item = item.toString();            		
                
                table[i].counted = this.formatNumber(table[i].counted);
                
                table[i].countedAux = parseFloat(table[i].counted.replace(/,/g,""));   
                
                if(table[i].quantity != '-'){
                    
                    table[i].quantity = this.formatNumber(table[i].quantity);
                    
                    table[i].quantityAux = parseFloat(table[i].quantity.replace(/,/g,""));
                }else{
                    
                    table[i].quantityAux = 0;
                }
                
                if(i < (table.length + 1)){
                    try {
                        
                        if(table[i].matnr != table[i + 1].matnr){
                            item ++;
                        }	
                    } catch (e) {
                        console.warn(e);
                    }
                }
            }
        }
            
            let oTable = this.byId("oTableExplRepByLgpla");
            oTable.setModel(new JSONModel(table),"oModelMatExplLgpla");
            this.sendTableMatExplByLgpla(table);//Fase 3
            
            BusyIndicator.hide();
    },
    
    sendTableMatExplByLgpla: async function(table){
        console.log("Entrando a sendTable Lgpla");
        for(let i in table){
            table[i].docInvId = this.currentDocInvId;
        }
        let request = new Object();
        request.tokenObject = null;
        request.lsObject = table;

        const json = await this.execService(InveServices.SAVE_EXPLOSION_REPORT_BY_LGPLA,request,"saveExplosionReportByLgpla",this.showLog);

        if(json){
            console.log('saveExplosionReportByLgpla',json);   
            BusyIndicator.hide();
        }
    },
    
    getExplDataTableMatExplByLgpla: function(){
        
        let modelData;
        
        try {
            modelData = this.byId("oTableExplRepByLgpla").getModel("oModelMatExplLgpla").getData();
        } catch (error) {

            MessageBox.show(error,MessageBox.Icon.ERROR, "Error");
        }
        
        return modelData;
},

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                              FUNCIONES EN GENERAL
       
        columns: function(evt){
           
            let tableId = evt.getSource().getParent().getParent().getId();
            this.configTable(sap.ui.getCore().byId(tableId));
        },

        configTable: function(oTable){
            
            this.currentTable = oTable;
            let modelConfigTable = [];
            let columns = oTable.getColumns();
            for(let i in columns){
                let item = new Object();
                item.text = columns[i].getHeader().getText();
                item.visible = columns[i].getVisible();
                modelConfigTable.push(item);
            }
            if(!this.mapTables.get(oTable)){
                this.mapTables.set(oTable,this.copyObjToNew(modelConfigTable));
            }
            
            this.modelConfigTable = modelConfigTable;

            let oView = this.getView();
            if (!this.byId("oDialogConfigTable")) {
    
                Fragment.load({
                    id: oView.getId(),
                    name: "com.bmore.inveweb.view.fragments.vMCConfigTable",
                    controller: this
                  }).then(function(oDialog){
                    oView.addDependent(oDialog);	
                    this.frgById("oConfigTable").setModel(new JSONModel(this.modelConfigTable),"oModel");
                    oDialog.open();
                  }.bind(this));
            }else{
                this.frgById("oConfigTable").setModel(new JSONModel(this.modelConfigTable),"oModel");
                this.byId("oDialogConfigTable").open();
            }
           
        },
        changeSwitch: function(evt){
            let text = evt.getSource().getParent().mAggregations.cells[1].getText();
            let columns = this.currentTable.getColumns();
            for(let i in columns){
               if(text == columns[i].getHeader().getText()){
                    columns[i].setVisible(evt.getParameters().state);
                    break;
               } 
            }
        },
        _closeDialogConfigTable:function(){
            this.byId("oDialogConfigTable").close();
        },
        frgById: function(id){

            return Fragment.byId(this.getView().getId(),id);
        },
        restoreColumns: function(){
            let defaultModel =this.mapTables.get(this.currentTable);
            let columns = this.currentTable.getColumns();
            for(let i in columns){
                    for(let j in defaultModel){
                        if(defaultModel[j].text == columns[i].getHeader().getText()){
                            columns[i].setVisible(defaultModel[j].visible);
                            break;
                        } 
                    }
                
                }
                this._closeDialogConfigTable();
        },
      })
    }
);