/* eslint-disable consistent-return */
sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/ui/core/Item",
	  "sap/ui/core/MessageType",
	  "sap/m/MessageBox",
      "sap/ui/core/util/Export",
      "sap/ui/core/util/ExportTypeCSV",
      "sap/ui/core/Fragment",
	],
	function (Controller, BusyIndicator, JSONModel, Item, MessageType, MessageBox,Export,ExportTypeCSV,Fragment) {
	  "use strict";

	  return Controller.extend("com.bmore.inveweb.controller.vRoute", {

        onInit: function() {

            //Code to execute every time view is displayed
            this.getView().addDelegate({

                onBeforeShow: function() {

                    BusyIndicator.hide();
                    this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
                    this.showLog=false;
                    setTimeout(function() {
                        $("#vRoute--routeId-inner").attr("readonly", "readonly");
                    },500);

                    this.cleanView();
                    this.backupRecord = {};

                    this.setBukrsAndWerks();


                }.bind(this)
            });

        },

        cleanView: function(){

            this.eraseNotification();
            this.setOnEdit(false);

            //Enable disable controls menu
            this.byId("bNew").setEnabled(true);
            this.byId("bEdit").setEnabled(false);
            this.byId("bCancel").setEnabled(false);
            this.byId("bDelete").setEnabled(false);
            this.byId("bSave").setEnabled(false);
            this.byId("bClone").setEnabled(false);

            //Clean controls
            this.byId("routeId").setValue("");
            this.byId("routeId").setEnabled(true);
            this.byId("description").setValue("");
            this.byId("description").setEditable(false);

            if (this.ADMIN_ROLE){
                this.byId("bukrs").setSelectedKey(null);
                this.byId("werks").removeAllItems();
            }

            this.byId("bukrs").setEnabled(false);

            this.byId("werks").setSelectedKey(null);

            this.byId("createdBy").setValue("");
            this.byId("modifiedBy").setValue("");

            //Enable Controls to add positions
            this.byId("bAddPosition").setEnabled(false);
            this.byId("bDeletePosition").setEnabled(false);

            //Clean table positions
            let oModel = new JSONModel([]);

            let oTablePositions = this.byId("oTablePositions");
            oTablePositions.setModel(oModel, "oModel");

        },

        eraseNotification: function() {
            this.byId("vbFrame").setVisible(false);
        },

        returnAction: function() {
            window.history.go(-1);
        },

        setBukrsAndWerks: async function(){
            let cmbxBukrs = await this.loadSocieties(this.byId("bukrs"));
            if (!this.ADMIN_ROLE){

                let bukrs = this.getBukrs();
                cmbxBukrs.setSelectedKey(bukrs);
                cmbxBukrs.setEnabled(false);

                let cmbxWerks = this.byId("werks");

                if (cmbxWerks.getItems().length == 0){

                    await this.loadWerks();
                }

                let werks = this.getWerks();
                this.byId("werks").setSelectedKey(werks);
                this.byId("werks").setEnabled(false);
            }
        },

        showModalRoutes: function(){
            BusyIndicator.show(0);
            this.eraseNotification();
            let oView = this.getView();
            if (!this.byId("oDialogRoute")) {
    
                Fragment.load({
                    id: oView.getId(),
                    name: "com.bmore.inveweb.view.fragments.vMCRoute",
                    controller: this
                  }).then(function(oDialog){
                    oView.addDependent(oDialog);	
                    this.cleanOdialog();
                    oDialog.open();
                  }.bind(this));
            }else{
                this.cleanOdialog();
                this.byId("oDialogRoute").open();
            }

            BusyIndicator.hide();
        },
        loadRoutes: async function(oEvent){
            
            let clear = oEvent.getParameters().clearButtonPressed;
            
            if(clear){
                this.cleanOdialog();
                return;
            }
			
            let oTableRoutes = this.frgById("oTableRoutes");			
            oTableRoutes.setModel(new JSONModel([]),"ofrgModel");
            
            let bukrs;
            let werks;
            bukrs = null;
            werks = null;
                    
            if(!this.ADMIN_ROLE){
                
                bukrs = this.getBukrs();
                werks = this.getWerks();
            }
            
            let search =  this.frgById("fSearchRoute").getValue();
            const routeBean = {
                routeId : search,
                bukrs : bukrs,
                werks : werks,
                rdesc : search
            }

            const request = {
                tokenObject: null,
                lsObject:routeBean
            };

            const json = await this.execService(InveServices.GET_ONLY_ROUTES,request,"loadRoutes",this.showLog);

			if(json){
                //Create a model and bind the table rows to this model
                for(let i in json.lsObject){
                    json.lsObject[i].routeIdAux = parseInt(json.lsObject[i].routeId);
                }
                                    
                oTableRoutes.setModel(new JSONModel(json.lsObject),"ofrgModel");
                oTableRoutes.setGrowingThreshold(json.lsObject.length);
                BusyIndicator.hide();
            }
        },
        getRoute: async function(routId){
            
            let routeBean = {
                routeId : routId,
            }

            const request = {
                tokenObject: null,
                lsObject:routeBean
            };
            const json = await this.execService(InveServices.GET_ROUTES,request,"getRoute",this.showLog);

			if(json){
                let row = json.lsObject[0];
                        
               this.backupRecord = row;
                
                try {
                    this.byId('routeId').setValue(row.routeId);
                } catch (e) {
                    console.warn(e);
                }
                
                try {			
                    this.byId('description').setValue(row.rdesc);
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
                        text : row.werks + " - " +row.wdesc, // string
                        key : row.werks, // string
                        tooltip : row.werks 
                    });
                    
                    this.byId('werks').addItem(item);
                    this.byId('werks').setSelectedKey(row.werks);
                    this.byId('werks').setEnabled(false);			
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
                    
                    let arrAux = this.copyObjToNew(row.positions);
                    
                    //Add disable property to table model
                    for(let i = 0; i < arrAux.length; i++){
                        
                        arrAux[i].editable = false;	            			
                    }
                    
                    let oModelPotisions = new JSONModel(arrAux);
                    
                    let oTablePositions = this.byId("oTablePositions");
                    oTablePositions.setModel(oModelPotisions,"oModel");
                                                                                
                } catch (e) {
                    console.warn(e);
                }
                
                //Enable / Disable controls on view
                try {
                    this.byId("bNew").setEnabled(true);
                    this.byId("bEdit").setEnabled(true);
                    this.byId("bCancel").setEnabled(false);
                    this.byId("bSave").setEnabled(false);
                    this.byId("bDelete").setEnabled(true);
                    this.byId("bClone").setEnabled(true);
                    
                    this.byId("bUpload").setEnabled(false);
                    this.byId("bAddPosition").setEnabled(false);
                    this.byId("bDeletePosition").setEnabled(false);
                    
                } catch (e) {
                    console.warn(e);
                }
                BusyIndicator.hide();
            }
    
        },
        selectRouteFragment: function(oEvent){
            let row = {
                routeId : oEvent.getParameters().listItem.mAggregations.cells[0].getText(),
                rdesc: oEvent.getParameters().listItem.mAggregations.cells[1].getText()
            }

            this.getRoute(row.routeId);
            this.setDocInvFlag(false);
            this._closeDialogRoute();
        },
        cleanOdialog: function(){
            
            this.frgById("fSearchRoute").setValue("");				
            this.frgById("oTableRoutes").setModel(new JSONModel([]),"ofrgModel");
        },
        _closeDialogRoute:function(){
            this.byId("oDialogRoute").close();
        },
        frgById:function(id){
            return Fragment.byId(this.getView().getId(), id);
        },

        functionTocallAtEndForRoutes: function(viewId){// A function to call after the oDialog closes

            viewId += "--";

            sap.ui.getCore().byId(viewId + "bNew").setEnabled(true);
            sap.ui.getCore().byId(viewId + "bEdit").setEnabled(true);
            sap.ui.getCore().byId(viewId + "bCancel").setEnabled(false);
            sap.ui.getCore().byId(viewId + "bDelete").setEnabled(true);
            sap.ui.getCore().byId(viewId + "bSave").setEnabled(false);
        },

        loadWerks: async function(){

            this.eraseNotification();

            let bukrsBean = {
                bukrs: this.byId("bukrs").getSelectedKey()
            };

            const request = {
                tokenObject: null,
                lsObject: bukrsBean
            };

            const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);
            if(json){
                let selectWerks = this.byId("werks");
                selectWerks.removeAllItems();
                selectWerks.destroyItems();
                let data = json.lsObject;

                this.fillWerks(data,selectWerks);

                this.cleanTable();
                return selectWerks;
            }

        },

        setFocus: function(){

            setTimeout(function() {
                this.getView().byId("bAddPosition").focus();
             }.bind(this),100);
            this.cleanTable();
        },

        cleanTable: function(){

            //Empty table
            let oModel = new JSONModel([]);

            let oTable = this.byId("oTablePositions");
            oTable.setModel(oModel, "oModel");
        },

        generatePreview: function(){

            let win = window.open("./preview.html", "_blank");
            win.focus();
        },

        newRecord: function(){

            this.backupRecord = {};
            this.eraseNotification();
            //Turn on edit Flag
            this.setOnEdit(true);

            //Enable disable controls menu
            this.byId("bNew").setEnabled(false);
            this.byId("bEdit").setEnabled(false);
            this.byId("bCancel").setEnabled(true);
            this.byId("bDelete").setEnabled(false);
            this.byId("bSave").setEnabled(true);
            this.byId("bClone").setEnabled(false);

            //Clean controls
            this.byId("routeId").setValue("");
            this.byId("routeId").setEnabled(false);
            this.byId("description").setValue("");
            this.byId("description").setEditable(true);

            if (!this.ADMIN_ROLE){

                this.byId("bukrs").setEnabled(false);
                this.byId("werks").setEnabled(false);
            } else {

                this.byId("bukrs").setSelectedKey(null);
                this.byId("bukrs").setEnabled(true);
                this.byId("werks").removeAllItems();
                this.byId("werks").setSelectedKey(null);
                this.byId("werks").setEnabled(true);
            }

            setTimeout(function() {
                this.getView().byId("description").focus();
            }.bind(this),100);

            this.byId("createdBy").setValue("");
            this.byId("modifiedBy").setValue("");

            //Enable Controls to add positions
            this.byId("bUpload").setEnabled(true);
            this.byId("bAddPosition").setEnabled(true);
            this.byId("bDeletePosition").setEnabled(true);

            //Clean table positions
            let oModel = new JSONModel([]);
            let oTablePositions = this.byId("oTablePositions");
            oTablePositions.setModel(oModel, "oModel");

        },

        editRecord: async function(){

            this.eraseNotification();
            if (await this.isAssignedRoute()){
                MessageBox.show(this.messageRouteAssigend,
                        MessageBox.Icon.ERROR, "Conflicto");

                return;

            }

            //Turn on edit Flag
            this.setOnEdit(true);

            //Enable disable controls menu
            this.byId("bNew").setEnabled(false);
            this.byId("bEdit").setEnabled(false);
            this.byId("bCancel").setEnabled(true);
            this.byId("bSave").setEnabled(true);
            this.byId("bDelete").setEnabled(false);
            this.byId("bClone").setEnabled(false);

            //Enable form controls
            this.byId("routeId").setEnabled(false);
            this.byId("description").setEditable(true);
            this.byId("bukrs").setEnabled(false);
            this.byId("werks").setEnabled(false);

            //Enable Controls to add positions
            this.byId("bUpload").setEnabled(true);
            this.byId("bAddPosition").setEnabled(true);
            this.byId("bDeletePosition").setEnabled(true);

            //Enable content for table positions
            let oTablePositions = this.byId("oTablePositions");
            let modelDataPos;

            try {
                modelDataPos = oTablePositions.getModel("oModel").getData();
            } catch (e) {
                modelDataPos = [];
            }

            for (let i = 0; i < modelDataPos.length; i++){
                modelDataPos[i].editable = true;
            }

            let modelPositions = new JSONModel(modelDataPos);
            oTablePositions.setModel(modelPositions, "oModel");
        },

        cancelEdition: function(){

            this.eraseNotification();

            MessageBox.confirm(
                     "¿Desea cancelar la edición?", {
                          icon: MessageBox.Icon.QUESTION,
                          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                          onClose: function(oAction) {

                            if (oAction == "YES"){

                                this.setOnEdit(false);

                                this.byId("bNew").setEnabled(true);

                                let routeId = this.byId("routeId").getValue();
                                if (routeId.length == 0){
                                    this.byId("bEdit").setEnabled(false);
                                    this.byId("bClone").setEnabled(false);
                                } else {

                                    this.byId("bEdit").setEnabled(true);
                                    this.byId("bClone").setEnabled(true);
                                }

                                //Disable/Enable controls
                                this.byId("bCancel").setEnabled(false);
                                this.byId("bDelete").setEnabled(true);
                                this.byId("bSave").setEnabled(false);
                                this.byId("routeId").setEnabled(true);
                                this.byId("description").setEditable(false);
                                this.byId("bukrs").setEnabled(false);
                                this.byId("werks").setEnabled(false);

                                this.byId("description").setValueState("None");

                                //Disable Cotrols to add positions
                                this.byId("bUpload").setEnabled(false);
                                this.byId("bAddPosition").setEnabled(false);
                                this.byId("bDeletePosition").setEnabled(false);

                                try {
                                    this.byId("description").setValue(this.backupRecord.rdesc);
                                } catch (e) {
                                    this.byId("description").setValue("");
                                }

                                try {
                                    if (this.ADMIN_ROLE){
                                        this.byId("bukrs").setSelectedKey(this.backupRecord.bukrs);
                                    }
                                } catch (e) {
                                    this.byId("bukrs").setSelectedKey(null);
                                }

                                try {
                                    if (this.ADMIN_ROLE){
                                        this.byId("werks").setSelectedKey(this.backupRecord.werks);
                                    }
                                } catch (e) {
                                    this.byId("werks").setSelectedKey(null);
                                }

                                //Reset the values
                                let oTablePositions = this.byId("oTablePositions");

                                let positions;

                                try {
                                    //Restore table positions
                                    for (let i = 0; i < this.backupRecord.positions.length; i++){
                                         this.backupRecord.positions[i].editable = false;
                                    }

                                    positions = this.copyObjToNew(this.backupRecord.positions);
                                } catch (e) {
                                    positions = [];
                                }
                                if(positions.length == 0){
                                    this.byId("bDelete").setEnabled(false);
                                }
                                let modelPositions = new JSONModel(positions);
                                oTablePositions.setModel(modelPositions, "oModel");

                            }
                        }.bind(this)
                    }
                );
        },

        downloadTemplate: function(){
		
            let link = document.createElement("a");
            link.href = InveTemplates.ROUTES;
            link.click();		
        },

        saveEdition: async function(oEvent){

            let flagClone = false;

            if (oEvent.getSource().getId() == "container-inveweb---vRoute--bClone"){
                flagClone = true;
            }

            this.eraseNotification();

            let value;
            value = this.byId("description").getValue();
            value = value.trim();
            if (value.length == 0){

                let message = "Es necesario introducir la \"Descripción\".";
                this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pRoute"));

                return;
            }

            value = this.byId("bukrs").getSelectedKey();
            value = value.trim();
            if (value.length == 0){

                let message = "Es necesario definir la \"Sociedad\".";
                this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pRoute"));

                return;
            }

            value = this.byId("werks").getSelectedKey();
            value = value.trim();
            if (value.length == 0){

                let message = "Es necesario seleccionar un \"Centro\".";
                this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pRoute"));

                return;
            }

            //Check data from table positions
            let oTablePositions = this.byId("oTablePositions");
            let modelData;

            try {
                modelData = oTablePositions.getModel("oModel").getData();
            } catch (e) {
                modelData = [];
            }

            let size = modelData.length;

            if (size == 0){

                let message = "Posiciones: Es necesario definir al menos una zona.";
                this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pRoute"));
                this.byId("tabBarSections").setSelectedKey("itbPositions");

                return;
            }

            let regexA = /^[0-9]*$/;
            let regexB = /^([0-9]*|1a|1A|1b|1B)$/;

            //Validate the sequence on zone positions
            for (let i = 0; i < size; i++){

                if (flagClone){

                    modelData[i].positionId = null;
                }

                if (modelData[i].secuency == undefined ||
                        modelData[i].secuency.length == 0){

                    let message = "Posiciones: Es necesario definir todas las secuencias";
                    this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pRoute"));

                    return;
                }

                let valueAux = parseInt(modelData[i]);

                if (!modelData[i].secuency.match(regexA) || valueAux == 0){

                    let message = "Posiciones: La secuencia \"" + modelData[i].secuency +
                    "\" no en una entrada válida.";
                    this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pRoute"));

                    return;
                }

                if (modelData[i].secuency > size){

                    let message = "Posiciones: La secuencia \""+ modelData[i].secuency +
                    "\" excede el número de entradas definidas.";
                    this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pRoute"));

                    return;
                }

                for (let j = i + 1; j < size; j++){

                    if (modelData[i].zoneId == modelData[j].zoneId){

                        let message = "Posiciones: La Zona \""+ modelData[i].zoneId +
                        "\" se encuentra repetida.";
                        this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pRoute"));

                        return;
                    }

                    if (modelData[i].secuency == modelData[j].secuency){

                        let message = "Posiciones: La secuencia \""+ modelData[i].secuency +
                        "\" se encuentra repetida.";
                        this.message(message, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pRoute"));

                        return;
                    }

                }
            }

            let route = new Object();
            if (flagClone){

                route.routeId = "";
            } else {
                route.routeId = this.byId("routeId").getValue();
            }

            route.rdesc = this.byId("description").getValue();
            route.bukrs = this.byId("bukrs").getSelectedKey();
            route.BDesc = null;
            route.werks = this.byId("werks").getSelectedKey();
            route.WDesc = null;

            try {
                route.positions = this.byId("oTablePositions").getModel("oModel").getData();
            } catch (e) {
                route.positions = null;
            }

            this.byId("oTablePositions").getModel("oModel").refresh(true);

            //save the record
            const request = {
                tokenObject: null,
                lsObject: route
            };
            const json = await this.execService(InveServices.ADD_ROUTE,request,"addRoute",this.showLog);
            if(json){
                this.setOnEdit(false);

                //Disable form controls
                this.byId("routeId").setEnabled(true);
                this.byId("description").setEditable(false);
                this.byId("bukrs").setEnabled(false);
                this.byId("werks").setEnabled(false);

                //Disable / enable the controls
                this.byId("bNew").setEnabled(true);
                this.byId("bEdit").setEnabled(true);
                this.byId("bCancel").setEnabled(false);
                this.byId("bSave").setEnabled(false);
                this.byId("bDelete").setEnabled(true);
                this.byId("bClone").setEnabled(true);

                //Disable controls on positions table
                this.byId("bUpload").setEnabled(false);
                this.byId("bAddPosition").setEnabled(false);
                this.byId("bDeletePosition").setEnabled(false);
                this.byId("oTablePositions").getModel("oModel").refresh(true);

                // //Refresh table with new data
                    this.backupRecord = json.lsObject;
                this.byId("routeId").setValue(this.backupRecord.routeId);
                this.byId("createdBy").setValue(this.backupRecord.createdBy);
                this.byId("modifiedBy").setValue(this.backupRecord.modifiedBy);
                let positions = JSON.parse(JSON.stringify(json.lsObject.positions));
                // let groups = JSON.parse(JSON.stringify(json.lsObject.groups)) ;

                let size = positions.length;
                for (let i = 0; i < size; i++){
                        positions[i].editable = false;
                    }

                let oModelPositions = new JSONModel(positions);
                this.byId("oTablePositions").setModel(oModelPositions, "oModel");
                this.byId("oTablePositions").getModel("oModel").refresh(true);

                let message;

                if (flagClone){
                    message = "Se clonó la ruta de forma exitosa.";
                } else {
                    message = "La ruta se guardó de forma exitosa.";
                }

                this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pRoute"));

                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close();
                }.bind(this),3000);
                BusyIndicator.hide();
            }

        },

        deleteRecord: async function(){
		
            //Clear notifications
            this.eraseNotification();
            MessageBox.confirm(
                "¿Desea elimiar el registro?", {
                    icon: MessageBox.Icon.QUESTION,
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: async function(oAction) { 
                        
                        if(oAction == 'YES'){
                            let flagAssigned =  await this.isAssignedRoute()
                            if(flagAssigned){
                                MessageBox.show(this.messageRouteAssigend,
                                        MessageBox.Icon.ERROR, "Conflicto");
                                
                                return;

                            }
                            
                            await this.deleteRemote(this.byId("routeId").getValue());
                                                                                                            
                        }  			        	  			        	  
                    }.bind(this)						
                }
            );
            
        },

        deleteRemote: async function(routeId){
            const request = {
                tokenObject: null,
                lsObject: routeId
            };

            const json = await this.execService(InveServices.DELETE_ROUTE,request,"deleteRoute",this.showLog);
            if(json){
                //Disable/Enable controls		
                this.byId("bNew").setEnabled(true);
                this.byId("bEdit").setEnabled(false);
                this.byId("bCancel").setEnabled(false);			        		
                this.byId("bDelete").setEnabled(false);
                this.byId("bSave").setEnabled(false);
                this.byId("bClone").setEnabled(false);
                this.byId("description").setEditable(false);
                                                                    
                this.byId("routeId").setValueState("None");
                this.byId("description").setValueState("None");
                this.byId("bukrs").setValueState("None");
                this.byId("werks").setValueState("None");
                this.byId("createdBy").setValue("");
                this.byId("modifiedBy").setValue("");
                                    
                //Disable Cotrols to add positions
                this.byId("bUpload").setEnabled(false);
                this.byId("bAddPosition").setEnabled(false);
                this.byId("bDeletePosition").setEnabled(false);
                                                                            
                //Reset the values and disable inputs
                this.byId("routeId").setValue("");	
                this.byId("description").setValue("");
                this.byId("description").setEditable(false);
                if(this.ADMIN_ROLE){
                    this.byId("bukrs").setSelectedKey(null);
                }	        		
                this.byId("bukrs").setEnabled(false);
                if(this.ADMIN_ROLE){
                    this.byId("werks").setSelectedKey(null);
                }	        		
                this.byId("routeId").setEnabled(true);
                this.byId("werks").setEnabled(false);
                this.byId("createdBy").setValue("");
                this.byId("modifiedBy").setValue("");
                                                                                                
                let oTablePositions = this.byId("oTablePositions");		
                oTablePositions.setModel(new JSONModel([]),"oModel");		        		
                
                let message = 'El registro fue eliminado de forma exitosa.'; 
                this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pRoute"));       			
                  
                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close();  
                }.bind(this),3000);
            }
        },

        openMCZones: function(oEvent){

            this.eraseNotification();

            let society = this.byId("bukrs").getSelectedKey();
            society = society.trim();

            if (society.length == 0){

                MessageBox.show("Es necesario elegir la \"Sociedad\".",
                        MessageBox.Icon.ERROR, "Error");

                return;
            }

            let center = this.byId("werks").getSelectedKey();
            center = center.trim();

            if (center.length == 0){

                MessageBox.show("Es necesario elegir el \"Centro\".",
                        MessageBox.Icon.ERROR, "Error");

                return;
            }
/////////////////////////////////////////////////////////////////////////////////////////////////
            let oView = this.getView();
            if (!this.byId("oDialogZone")) {
    
                Fragment.load({
                    id: oView.getId(),
                    name: "com.bmore.inveweb.view.fragments.vMCZone",
                    controller: this
                  }).then(function(oDialog){
                    oView.addDependent(oDialog);
                    this.cleanOdialogFragment();
                    oDialog.open();
                  }.bind(this));
            }else{
                this.cleanOdialogFragment();
                this.byId("oDialogZone").open();
            }
/////////////////////////////////////////////////////////////////////////////////////////////////
            /* if (!this.vMCZone) {

                this.idFrgVMCZone = this.getView().createId("vMCZone");

                this.ctrlVMCZone = sap.ui.controller("com.bmore.inveweb.controller.vMCZone");
                this.vMCZone = sap.ui.xmlfragment(
                    this.idFrgVMCZone,
                    "com.bmore.inveweb.view.fragments.vMCZone",
                    this.ctrlVMCZone
                );
                this.getView().addDependent(this.vMCZone);
            }

            if (!this.oDialogMCZone) {

                let oDialogMCZoneId = this.getView().createId("oDialogZone");

                this.oDialogMCZone = new Dialog({
                    id: oDialogMCZoneId, // sap.ui.core.ID
                    title: "Seleccionar Zona", // string
                    contentWidth: "35%", // sap.ui.core.CSSSize, since 1.12.1
                    content: [this.vMCZone], // sap.ui.core.Control
                    beginButton: new Button({
                        text: "Cerrar",
                        press: function () {
                            this.oDialogMCZone.close();
                        }.bind(this)
                    })
                });
            }

            let oTablePositions = this.byId("oTablePositions"); //The input id where must put the key
            let oDialogMCZone = this.oDialogMCZone;
            this.ctrlVMCZone.setControlSettings(this.idFrgVMCZone, oDialogMCZone, oTablePositions);
            this.oDialogMCZone.open(); */

        },
        loadZones: async function(oEvent){
            
            let clear = oEvent.getParameters().clearButtonPressed;
            
            if(clear){
                this.cleanOdialog();
                return;
            }
            		
           	
            let oTableZones = this.frgById("oTableZones");	
            oTableZones.setModel(new JSONModel([]),"tableZoneFrgModel");
            
            let search = this.frgById("fSearch").getValue();
            if(search.length == 0){
                search = null;
            }
            
            let zoneBean = {
                bukrs : this.byId('bukrs').getSelectedKey(),
                werks : this.byId('werks').getSelectedKey(),
                zoneId : search,
                zdesc : search
            }

            const request = {
                tokenObject: null,
                lsObject: zoneBean
            };

            const json = await this.execService(InveServices.GET_ZONE,request,"loadZones",this.showLog);
            if(json){
                for(let i=0; i < json.lsObject.length; i++){
                        
                    json.lsObject[i].zoneId = json.lsObject[i].zoneId.toString();
                }
                
                //Create a model and bind the table rows to this model	 
                let oModel = new JSONModel(json.lsObject);		           		            		
                oTableZones.setModel(oModel,"tableZoneFrgModel");
            }
        },
        selectZone: function(oEvent){
            console.log("oEvent",oEvent);
            let oTableZones = this.frgById("oTableZones");
            let row =  oTableZones.getModel("tableZoneFrgModel").
            getProperty(oEvent.getSource().getBinding("items").
                getContexts()[oEvent.getSource().
                    indexOfItem(oEvent.getParameters().listItem)].sPath);
         
            let data;
            let entry = {
                zoneId : row.zoneId
            }
            
            try {
                data = this.byId("oTablePositions").getModel("oModel").getData();
            } catch (e) {
                data = [];
            }
            
            let size = data.length;
            for(let i = 0; i < size; i++){
                
                if(data[i].zoneId == entry.zoneId){
                    
                    MessageBox.show('La Zona ya se encuentra asignada.',
                            MessageBox.Icon.ERROR, "Error");
                    
                    return;
                }
            }
                    
            entry.zdesc = row.zdesc
            entry.lgort = row.lgort;
            entry.GDesc = row.GDesc;
            entry.secuency = (size + 1).toString();
            entry.editable = true;		
            data.push(entry);	
            
            this.byId("oTablePositions").getModel("oModel").refresh(true);
            this._closeDialogZone();
            
        }, 
        cleanOdialogFragment: function(){
            
            let fSearch = this.frgById("fSearch");
            fSearch.setValue("");
            let oModel = new JSONModel([]);			
            let oTableZones = this.frgById("oTableZones");	
            oTableZones.setModel(oModel,"tableZoneFrgModel");
        },
        _closeDialogZone:function(){
            this.byId("oDialogZone").close();
        },

        removePosition: function(){
            let oTablePositions = this.getView().byId("oTablePositions");
            let selectedItems = oTablePositions.getSelectedItems();
            if (selectedItems.length > 0){
                //Clean messages
                let messagesBox = this.getView().byId("messagesBox");
                messagesBox.removeAllItems();
                //Delete data
                let arr = [];
                let data = oTablePositions.getModel("oModel").getData();

                for (let i in oTablePositions.getItems()){
                   	if (selectedItems.indexOf(oTablePositions.getItems()[i]) == -1){
                        arr.push(data[i]);
                       }
                }

                oTablePositions.setModel(new JSONModel(arr), "oModel");

            } else {

                this.toast("Nada que eliminar", "20em");
            }

        },

        isAssignedRoute: async function(){

            let isAssignedRoute = undefined;
           
            const request = {
                tokenObject: null,
                lsObject: this.byId("routeId").getValue()
            };

            const json = await this.execService(InveServices.GET_DOC_BY_ASSIGNED_ROUTE,request,"deleteRoute",this.showLog);
            if(json){
                isAssignedRoute = json.abstractResult.booleanResult;
                     if(json.abstractResult.booleanResult){
                         this.messageRouteAssigend = json.abstractResult.resultMsgAbs
                         
                     }
                     BusyIndicator.hide();
                    return isAssignedRoute;
            }

        },

        exportRoutePositions: function(){
		
            let oTablePositions = this.byId("oTablePositions");		
            let modelData;
            
            try {
                modelData = oTablePositions.getModel("oModel").getData();
            } catch (e) {
                modelData = [];
            }
                    
            if(modelData.length == 0){
                this.toast("Nada que exportar...", "20em");
                return;
            }
            let routeId = this.byId("routeId").getValue();
            let description = this.byId("description").getValue();
            let societyId = this.byId("bukrs").getSelectedKey();
            let society = this.byId("bukrs").getSelectedItem().getText();
            let centerId = this.byId("werks").getSelectedKey();
            let center = this.byId("werks").getSelectedItem().getText();				
            let modelToExport = [];
            let row;
            
            for(let i = 0; i < modelData.length; i++){
                
                row = new Object();	
                if(i == 0){
                    
                    row.routeId = routeId;
                    row.description = description;
                    row.bukrs = societyId;
                    row.bukrsDesc = society;
                    row.werks = centerId;
                    row.werksDesc = center;
                }			
                row.positionId = modelData[i].positionId;			
                row.zoneId = modelData[i].zoneId;
                row.zdesc = modelData[i].zdesc;
                row.lgort = modelData[i].lgort;
                row.GDesc = modelData[i].GDesc;
                row.secuency = modelData[i].secuency;
                modelToExport.push(row);
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
                    name: "Id de Ruta",
                    template: {
                        content: "{routeId}"
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
                    name: "Posición",
                    template: {
                        content: "{positionId}"
                    }
                }, {
                    name: "Clave Zona",
                    template: {
                        content: "{zoneId}"
                    }
                }, {
                    name: "Zona",
                    template: {
                        content: "{zdesc}"
                    }
                }, {
                    name: "Clave Almacén",
                    template: {
                        content: "{lgort}"
                    }
                }, {
                    name: "Almacén",
                    template: {
                        content: "{GDesc}"
                    }
                }, {
                    name: "Secuencia",
                    template: {
                        content: "{secuency}"
                    }
                }]
            });
            oExport.saveFile("Ruta-"+routeId).catch(function(oError) {
                console.error(oError);
            }).then(function() {
                oExport.destroy();
            }); 
            
        },

        openFilePicker: function(){
		
            $('#file').click();		
        },
        
        uploadTemplate:	function(){		
            let file = $('#file').prop('files')[0];
            let allowedFiles=['csv'];
            let ext = file.name.split('.').pop().toLowerCase();
            let that = this;
            
            //Check if is an allowed file
            if(allowedFiles.indexOf(ext) == -1){
                this.toast("Tipo de archivo no permitido, " +
                        "solo se permiten archivos de tipo: " +  allowedFiles, '20em');
                $('#file').val("");
                return;
            }
                    
            let reader = new FileReader();
    
            // Read file into memory as UTF-8
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
                
                if(allTextLines[size - 1].indexOf(",") == -1){
                    allTextLines.splice(-1);
                }
                            
                try {
                    arrTable = that.byId("oTablePositions").getModel("oModel").getData();
                } catch (e) {
                    arrTable = [];
                }
                            
                for (let i = 1; i < allTextLines.length; i++) {
    
                    data = allTextLines[i].split(',');
                    
                    if(data.length < 2){
                        
                        that.toast("Datos faltantes para la entrada: " + i, '20em');
                        return;
                    }
                    
                    if(data.length > 0){
                        
                        object = new Object();	        	
                        object.zoneId = data[0];
                        object.zdesc = data[0];
                        object.lgort = undefined;
                        object.GDesc = undefined;	        	
                        object.secuency = data[1];
                        arrTable.push(object);
                    }		        	
                }
                
                let oModel = new JSONModel(arrTable);
                
                let oTablePositions = that.byId("oTablePositions");
                oTablePositions.setModel(oModel,"oModel");
                that.message('Carga concluida con éxito.', MessageType.Success,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pRoute"));
                
                setTimeout(function(){	                		
                    that.byId("messagesBox").getItems()[0].close();            		
                }, 5000);	        
               
            }
    
            function errorHandler(evt) {
    
                if(evt.target.error.name == "NotReadableError") {
                    MessageBox.show('No se puede leer el archivo.',					
                            MessageBox.Icon.ERROR, "Error");
              }
    
            }		
            
            $('#file').val("");
                            
        },
      });
    }
  );