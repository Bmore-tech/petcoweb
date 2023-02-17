sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/Dialog",
	  "sap/m/Button",
	  "sap/ui/core/Item",
	  "sap/ui/core/MessageType",
	  "sap/m/MessageBox",
      "sap/ui/core/util/Export",
      "sap/ui/core/util/ExportTypeCSV",
      "sap/ui/core/Fragment",
	],
	function (Controller,BusyIndicator,JSONModel,Dialog,Button,Item,MessageType,MessageBox,Export,ExportTypeCSV,Fragment) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vInvDocument", {

        onInit: function() {
            this.fromvAssignTeam = false;
            console.log("docInv");
            // Code to execute every time view is displayed
            this.getView().addDelegate({
                
                
                onBeforeShow: function(evt) {
                   this.showLog = false;
                    this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
                    BusyIndicator.hide();
                    if(!this.ADMIN_ROLE){
                        this.cleanTable();
                    }
                    if(!this.fromvAssignTeam){
                        this.cleanView();
                    }
                    
                    // Load table data
                    this.backupRecord = [];  
                    
                    this.setBukrsAndWerks();
                }.bind(this)
            });	
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
                
                let cmbxWerks = this.byId("werksCreate");
                            
                if(cmbxWerks.getItems().length == 0){
                    
                    await this.loadWerks();
                }
                
                let werks = this.getWerks();
                cmbxWerks.setSelectedKey(werks);
                cmbxWerks.setEnabled(false);			
            }
        },
        
        cleanView: function(){
                    
            this.eraseNotification();		
            
            // Set the state for main controls
            this.byId("bNew").setEnabled(true);
            this.byId("bCancel").setEnabled(false);
            //this.byId("bDelete").setEnabled(false);
            this.byId("bSave").setEnabled(false);
            
            // Clean form
            this.byId("invDocIdCreate").setValue("");
            this.byId("invDocId").setValue("");
            
            if(this.ADMIN_ROLE){
                this.byId("bukrsCreate").setSelectedKey(null);
                this.byId("werksCreate").removeAllItems();
                this.byId("werksCreate").setSelectedKey(null);
            }
            this.byId("bukrs").setSelectedKey(null);
            this.byId("werks").removeAllItems();
            this.byId("werks").setSelectedKey(null);

            this.byId("bukrsCreate").setEnabled(false);
            this.byId("werksCreate").setEnabled(false);
            this.byId("docTypeCreate").setSelectedKey("1");
            this.byId("docTypeCreate").setEnabled(false);
            this.byId("createdByCreate").setValue("");
            this.byId("modifiedByCreate").setValue("");

            this.byId("docType").setSelectedKey(null);

            this.byId("createdBy").setValue("");
            this.byId("modifiedBy").setValue("");
            
            let oTable = this.byId("oTable");
            oTable.setModel(new JSONModel([]),"oModel");
            
            this.byId("oTableCreate").setModel(new JSONModel([]),"oCreateModel");
    
            this.byId("fSearch").setEnabled(true);
            this.byId("bAddPosition").setEnabled(false);        
        },
        
        generateItem: function(select,text,key,tooltip,selectedItem){
            
            let selectComponent = this.byId(select);
            selectComponent.removeAllItems();
            
            let item = new Item({
                text : text, // string
                key : key, // string
                tooltip : tooltip, // sap.ui.core.TooltipBase
                });
            
            selectComponent.addItem(item);
            
            if(selectedItem){
                selectComponent.setSelectedItem(item);
            }
        },
        
        eraseNotification : function() {
            this.byId("vbFrame").setVisible(false);	
        },
        
        selectRow: function(oEvent){
            
            let index = oEvent.getParameter("rowIndex");
            this.currentIndex = index;
            try {
                this.byId("oTable").setSelectedIndex(index);
            } catch (e) {
                console.log(e);
            }
            
        },
        
        getData: async function (oEvent){
            
            this.eraseNotification();
            BusyIndicator.show(0);
            let listItems = oEvent.getParameters().listItem;
                let agreggation;
                try {
                    agreggation = listItems.mAggregations;
                } catch (error) {
                    agreggation = undefined;
                }
                let  cells;
                if(agreggation){
                    cells = agreggation.cells;
                }else{
                    cells =  this.byId("oTable").getItems()[0].getCells();
                }
                
                
                let row = {
                    docInvId : cells[0].getText(),
                    bukrsD : cells[1].getText(),
                    werksD : cells[2].getText(),
                    type : cells[3].getText(),
                    createdBy : cells[4].getText(),
                    status : cells[5].getText()
                }

                this.backupRow = row; 
                let invDocId = this.byId('invDocId');
                invDocId.setValue(row.docInvId);
                
                let rowDetail = await this.loadDocInvDetails(row.docInvId);
                
                this.setOnEdit(false);
                
                this.byId("bNew").setEnabled(true);
                this.byId("bCancel").setEnabled(false);
                this.byId("bSave").setEnabled(false);
                //this.byId("bDelete").setEnabled(true);

                this.generateItem('bukrs', rowDetail.bukrs + " - " + rowDetail.bukrsD, rowDetail.bukrs, rowDetail.bukrsD, true);
                this.byId("bukrs").setEnabled(false);					
                this.generateItem('werks', rowDetail.werks + " - " + rowDetail.werksD, rowDetail.werks, rowDetail.werksD,true);
                this.byId("werks").setEnabled(false);					
                this.byId("docType").setValue(row.type);

                // obtener usuario createdBy y modifiedBy del doc de inv
                
                try {
                    this.byId("createdBy").setValue(rowDetail.createdBy);
                } catch (e) {
                    console.warn(e);
                }
                
                try {
                    this.byId("modifiedBy").setValue(rowDetail.modifiedBy);
                } catch (e) {
                    console.warn(e);
                }
    
                
                
                if(row.status == "Cerrado" || row.status == "Cerrado y Conciliado con SAP"){
                    this.byId("GetDocConciliated").setEnabled(true);
                    this.byId("GetDocConciliated").setVisible(true);
                }else{
                    this.byId("GetDocConciliated").setEnabled(false);
                    this.byId("GetDocConciliated").setVisible(false);
                }
                
                //this.byId("bDelete").setEnabled(true);
                setTimeout(function(){
                    let scrtollTo = this.byId("titleEdi");
                    this.byId("pInvDocument").scrollToElement(scrtollTo);
                }.bind(this),50);
                BusyIndicator.hide();   
                
                
        },

        cancelEdition: function(){
            
            // Show confirm dialog
            MessageBox.confirm(
                     "¿Desea cancelar la edición?", {
                          icon: MessageBox.Icon.QUESTION,
                          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                          onClose: function(oAction) { 
                              
                            if(oAction == 'YES'){
                                this.setOnEdit(false);
                                this.cleanView();
                            }  			        	  			        	  
                        }.bind(this)						
                    }
                );
        },
        
        newRecord: function(){
            
            this.setOnEdit(true);
            this.backupRecord = {};
            this.eraseNotification();
            this.byId("tabBarSections").setSelectedKey("tabD");
            
            // Set the state for main controls
            this.byId("bNew").setEnabled(false);
            this.byId("bCancel").setEnabled(true);
            //this.byId("bDelete").setEnabled(false);
            this.byId("bSave").setEnabled(true);
            
            // Clean form
            this.byId("invDocIdCreate").setValue("");
            this.byId("invDocIdCreate").setEditable(false);
            
            if(!this.ADMIN_ROLE){
                //this.byId("bAddPosition").setEnabled(true);
                this.byId("bukrsCreate").setEnabled(false);
                this.byId("werksCreate").setEnabled(false);
            }else{
                
                this.byId("bukrsCreate").setSelectedKey(null);				
                this.byId("bukrsCreate").setEnabled(true);
                this.byId("werksCreate").removeAllItems();	
                this.byId("werksCreate").setSelectedKey(null);		
                this.byId("werksCreate").setEnabled(true);
            }	
            
            setTimeout(function() {
                
                if(this.ADMIN_ROLE){
                    this.byId("bukrsCreate").focus();
                }			
            }.bind(this),100);
            this.byId("docTypeCreate").setSelectedKey("1");
            this.setFocus();
            this.byId("docTypeCreate").setEnabled(true);
            this.byId("createdByCreate").setValue("");
            this.byId("modifiedByCreate").setValue("");
            
            let oTable = this.byId("oTableCreate");
            oTable.setModel(new JSONModel([]),"oCreateModel");
            
            // Enable Controls to add positions
            if(this.byId("oTableCreate").getSelectedItems().length > 0){
                this.byId("oTableCreate").removeSelections(true);
            }
            this.byId("tabBarSections").setExpanded(true);
        },
        
        deleteRecord: function(){
            // Show confirm dialog
             MessageBox.confirm(
                     "¿Desea eliminar los documentos seleccionados?", {
                          icon: MessageBox.Icon.QUESTION,
                          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                          onClose: function(oAction) { 
                              
                            if(oAction == 'YES'){
                                this.setOnEdit(false);
                                let oTable = this.byId("oTable");
                                let selectedItems = oTable.getSelectedItems();
                                let deleteDocTypesStr = "";
                                let flagWarnMsg = false;
                                for(let i in selectedItems){
                                    let cells = selectedItems[i].getCells();
                                    if(cells[5].getText() == "Cerrado" || cells[5].getText() == "Abierto"){
                                        flagWarnMsg = true;
                                        continue;
                                    }else{
                                        deleteDocTypesStr.length == 0 ? deleteDocTypesStr = cells[0].getText() : deleteDocTypesStr+= ","+cells[0].getText();
                                    }
                                    
                                }
                                // mostrar mensaje de advertencia de que no se
                                // borrara un doc con status cerrado
                                if(flagWarnMsg){
                                    MessageBox.show('Solamente se pueden borrar los documentos con status "Nuevo".',
                                            MessageBox.Icon.WARNING, "Advertencia");
                                    
                                    BusyIndicator.hide();
                                }
                                
                                
                                if(String(deleteDocTypesStr).length > 0){
                                    this.deleteDocInvs(deleteDocTypesStr);
                                }
                                
                                // set buttons
                                //this.byId("bDelete").setEnabled(false);
                            }  			        	  			        	  
                        }.bind(this)						
                    }
                );
        },
            
        saveEdition: function(){
            BusyIndicator.show(0);
            let society = this.byId("bukrsCreate").getSelectedKey().trim();
            let werk = this.byId("werksCreate").getSelectedKey().trim();
            let type = this.byId("docTypeCreate").getSelectedKey().trim();
            
            if(society.length == 0){
                this.eraseNotification();
                let mesage = 'Debe seleccionar Sociedad.'; 
                this.message(mesage, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pInvDocument"));
                BusyIndicator.hide();
                return;
            }
            
            if(werk.length == 0){
                
                let mesage = 'Debe seleccionar Centro.'; 
                this.message(mesage, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pInvDocument"));
                BusyIndicator.hide();
                return;
            }

            if(type.length == 0){
                let mesage = 'Debe seleccionar Tipo de Documento.'; 
                this.message(mesage, MessageType.Error,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pInvDocument"));
                BusyIndicator.hide();
                return;
            }
            
            this.generateArrayDocBeans();
        },
        
        loadSocieties: async function(){	
            const request = {
                tokenObject: null,
                lsObject:""
            };
            const json = await this.execService(InveServices.GET_BUKRS,request,"loadSocieties",this.showLog);

				if(json){
                    // Create items for select
                    let lsSocieties = json.lsObject;
                    let societySelect = this.byId("bukrsCreate");
                    societySelect.removeAllItems();
                    societySelect.destroyItems();
                    
                    for(let i =0; i< lsSocieties.length; i++){
                        let item = new Item({
                        text : lsSocieties[i].bukrs +" - "+lsSocieties[i].bukrsDesc, // string
                        key : lsSocieties[i].bukrs, // string
                        tooltip : lsSocieties[i].bukrs, // sap.ui.core.TooltipBase
                        });
                        
                        societySelect.addItem(item);
                    }
                    BusyIndicator.hide();
                    return societySelect;	
                }
    
        },
        
        checkRowsBukrs: function(){
            this.byId("werksCreate").setSelectedKey(null);
            this.byId("docTypeCreate").setSelectedKey(null);
            this.loadWerks();
        },
        
        loadWerks: async function(){
            
            let bukrsBean = {
                bukrs : this.byId("bukrsCreate").getSelectedKey()
            }
            const request = {
                tokenObject: null,
                lsObject:bukrsBean
            };
            const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);

				if(json){
                    // Create items for select
                    let lsWerks = json.lsObject;
                    let werkSelect = this.byId("werksCreate");
                    werkSelect.removeAllItems();
                    werkSelect.destroyItems();
                    
                    for(let i = 0; i< lsWerks.length; i++){
                        let item = new Item({
                        text : lsWerks[i].werks +" - "+ lsWerks[i].werksDesc, // string
                        key : lsWerks[i].werks, // string
                        tooltip : lsWerks[i].werks, // sap.ui.core.TooltipBase
                        });
                        
                        werkSelect.addItem(item);
                    }	
                    
                    setTimeout(function() {
                        this.getView().byId("werksCreate").focus();
                    }.bind(this),100); 
                    return werkSelect;
                }	
        },

        setTypeDoc: function(){

            setTimeout(function() {
                this.getView().byId("docTypeCreate").focus();
            }.bind(this),100); 
        },
        
        setFocus: function(){
            if(this.byId("docTypeCreate").getSelectedKey() == "2"){
                this.byId("colContadorA").getHeader().setText("Contador A");
                this.byId("colContadorB").setVisible(true);
            }else{
                this.byId("colContadorA").getHeader().setText("Contador");
                this.byId("colContadorB").setVisible(false);
            }
            if(this.byId("bukrsCreate").getSelectedKey() != null && 
                this.byId("werksCreate").getSelectedKey() != null && 
                    this.byId("docTypeCreate").getSelectedKey() != null){
                        this.byId("bAddPosition").setEnabled(true);
                    }else{
                        this.byId("bAddPosition").setEnabled(false);
                    }
           
            setTimeout(function() {
                this.getView().byId("bAddPosition").focus();
             }.bind(this),100);
            this.cleanTable();
        },
        
        cleanTable: function(){
            
            //Empty table
            let oTable = this.byId("oTableCreate");
            oTable.setModel(new JSONModel([]),"oCreateModel");	
        },
        
        showModalRoutes: function(){
            
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
        },
        loadRoutes: async function(oEvent){
            
            let clear = oEvent.getParameters().clearButtonPressed;
            
            if(clear){
                this.cleanOdialog();
                return;
            }

            let oModel = new JSONModel([]);			
            let oTableRoutes = this.frgById("oTableRoutes");			
            oTableRoutes.setModel(oModel,"ofrgModel");
            
            let bukrs;
            let werks;
            werks = this.byId("werksCreate").getSelectedKey();
            bukrs = this.byId("bukrsCreate").getSelectedKey();
                    
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
        getRouteForDocInv: async function(routeId){
            
            let viewId = this.viewId;
            
            const routeBean = {
                routeId : routeId,
                bukrs : this.byId("bukrsCreate").getSelectedKey(),
                werks : this.byId("werksCreate").getSelectedKey()
            }

            const request = {
                tokenObject: null,
                lsObject: routeBean
            };

            const json = await this.execService(InveServices.GET_ROUTES,request,"getRouteForDocInv",this.showLog);

			if(json){
                
                let row = json.lsObject[0];
                        
                this.backupRecord = row;
                
                let objDocInvRoutes = {};
                try {
                    objDocInvRoutes = {
                        routeId : row.routeId,
                        route : row.routeId + " - " +row.rdesc,
                        enabledUser : true
                    }
                } catch (e) {
                    console.warn("Some problem with row",row,e);
                }
                        
                
                //Load table values
                    
                try {			
                    
                    let oTableCreate = this.byId("oTableCreate");
                     let modelData = oTableCreate.getModel("oCreateModel").getData();
                     if(modelData.length == 0){
                         
                         let arrDocInvRoutes = [];
                         arrDocInvRoutes.push(objDocInvRoutes);
                         let oModelCreate = new JSONModel(arrDocInvRoutes);
                         oTableCreate.setModel(oModelCreate,"oCreateModel");
                     }else{
                        if(modelData.findIndex(x => x.routeId === objDocInvRoutes.routeId) == -1){
                            modelData.push(objDocInvRoutes);
                            oTableCreate.getModel("oCreateModel").refresh(true);
                        }else{
                            MessageBox.show('Ruta '+objDocInvRoutes.routeId+' ya ingresada',
                                       MessageBox.Icon.WARNING, "Advertencia");
                        }
                     }
                    
                                                                    
                } catch (e) {
                    console.error(e);
                }
                BusyIndicator.hide();
            }
        },
        selectRouteFragment: function(oEvent){

            let row = {
                routeId : oEvent.getParameters().listItem.mAggregations.cells[0].getText(),
                rdesc: oEvent.getParameters().listItem.mAggregations.cells[1].getText()
            }

            this.getRouteForDocInv(row.routeId);
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
        
        openMCAsignTo: function(oEvent){
            
             this.userValue = sap.ui.getCore().byId(oEvent.getParameters().id);
             let oView = this.getView();
            if (!this.byId("oDialogAssignTo")) {
    
                Fragment.load({
                    id: oView.getId(),
                    name: "com.bmore.inveweb.view.fragments.vMCAssignTo",
                    controller: this
                  }).then(function(oDialog){
                    oView.addDependent(oDialog);
                    this.frgById("fSearchAssignTo").setValue("");
                    this.frgById("oTableAsignTo").setModel(new JSONModel([]),"asignToModel");
                    oDialog.open();
                  }.bind(this));
            }else{
                this.frgById("fSearchAssignTo").setValue("");
                this.frgById("oTableAsignTo").setModel(new JSONModel([]),"asignToModel");
                this.byId("oDialogAssignTo").open();
            }

        },
        searchAsignTo: function(evt){
            if(evt.getParameters().clearButtonPressed){
                return;
            }
            BusyIndicator.show(0);
             let search = this.frgById("fSearchAssignTo").getValue().trim();

             if(search == "" || search.length == 0){
                 MessageBox.show('Favor de ingresar el id de red (VDI) o nombre completo del contador',
                             MessageBox.Icon.ERROR, "Error");
                     BusyIndicator.hide();
                 return;
             }
             this.loadLDAP_Users(search);
            
        },
        loadLDAP_Users: async function (user){	
            let  oTableAsignTo = this.frgById("oTableAsignTo");
            const request = {
                tokenObject: null,
                lsObject:user
            };
            const json = await this.execService(InveServices.GET_UME_USERS,request,"loadLDAP_Users",this.showLog);

			if(json){
                let arr = [];
                let obj = {};
                
                for(let i = 0; i < json.lsObject.length; i++){
                        
                    obj = {}; 
                    obj.id = json.lsObject[i].entity.identyId;
                    obj.desc = json.lsObject[i].genInf.name + " " + json.lsObject[i].genInf.lastName;
                    arr.push(obj);
                    
                }
                
                oTableAsignTo.setModel(new JSONModel(arr) ,"asignToModel");
                BusyIndicator.hide();  
            }
        },
        selectAssignTo: async function(oEvent){
            console.log("selectAssignTo");
            let listItems = oEvent.getParameters().listItem;
            let agreggation = listItems.mAggregations;
            let  cells = agreggation.cells;
            let row = {
                id : cells[0].getText(),
                desc : cells[1].getText()
            }
            //PARA USUARIOS
            let items = this.byId("oTableCreate").getItems();
            let pos = 0;
            for(let i in items){
               pos++;
               let cells = items[i].getCells();
               if(cells[3].getValue() == row.id+" - "+row.desc || cells[4].getValue() == row.id+" - "+row.desc){
                   BusyIndicator.hide();
                   MessageBox.show('El usuario '+row.id+', ya está asignado en la posición '+pos+', favor de elegir otro usuario',
                                   MessageBox.Icon.ERROR, "Usuario duplicado");
                           
                           return;
               }
            }

            this.userValue.setValue(row.id+" - "+row.desc);
            this._closeDialog();
        },
        _closeDialog:function(){
            this.byId("oDialogAssignTo").close();
        },	
        frgById:function(id){
            return Fragment.byId(this.getView().getId(), id);
        },
        
        searchFilter: function(evt){
            
            if(!this.byId("bNew").getEnabled()){
                this.cleanView();
            }
            
            let flag = evt.getParameters().clearButtonPressed
            if(flag){
                return;
            }
            
            let fSearch = this.byId("fSearch");
            if(fSearch.getValue().includes("INVTSK")){
                this.getDocByTaskId(fSearch.getValue());
                
            }else{
                this.loadDocInvTable(fSearch.getValue());
            }
            
        },

        getDocByTaskId: async function(task_Id){
            const request = {
                tokenObject: null,
                lsObject:task_Id
            };
            
            const json = await this.execService(InveServices.GET_DOC_BY_TASK_ID,request,"GET_DOC_BY_TASK_ID",this.showLog);
            console.log("Rod",String(json.lsObject));
            this.loadDocInvTable(String(json.lsObject));
        },
        
        loadDocInvTable: async function(value){
            BusyIndicator.show(0);
            this.eraseNotification();
            
            let bukrs = null; 
            let werks = null; 
            
            if(!this.ADMIN_ROLE){
                
                bukrs = this.getBukrs();
                werks = this.getWerks();
            }
            
            let docInvBean = {
                bukrs : bukrs,
                werks : werks
            }		
                    
            //let search = this.byId("fSearch").getValue();		
            let lsObject = [];
            lsObject.push(docInvBean);
            lsObject.push(value);
            
            const request = {
                tokenObject: null,
                lsObject:lsObject
            };
            
            const json = await this.execService(InveServices.GET_ONLY_DOC_INV,request,"GET_ONLY_DOC_INV",this.showLog);

			if(json){
                for(let i=0; i<json.lsObject.length; i++){
                                
                    json.lsObject[i].docInvIdAux = String(json.lsObject[i].docInvId);
                    
                    if(json.lsObject[i].status == undefined){
                        json.lsObject[i].status = "Nuevo";
                    }else if(json.lsObject[i].status == "1"){
                        json.lsObject[i].status = "Abierto";
                        json.lsObject[i].statusAux = "A"
                    }else if(json.lsObject[i].status == "0"){
                        json.lsObject[i].status = "Cerrado";
                        json.lsObject[i].statusAux = "C"
                    }else if(json.lsObject[i].status == "T"){
                        json.lsObject[i].status = "Cerrado por Sistema";
                        json.lsObject[i].statusAux = "T"
                    }else if (json.lsObject[i].status == "S"){
                        json.lsObject[i].status = "Cerrado por Administrador";
                        json.lsObject[i].statusAux = "S"
                    }else if (json.lsObject[i].status == "4"){
                        json.lsObject[i].status = "Cerrado y Conciliado con SAP";
                        json.lsObject[i].statusAux = "D"
                    }
                    json.lsObject[i].routeAux = parseInt(json.lsObject[i].route);
                    
                    if(json.lsObject[i].type == "1"){
                        json.lsObject[i].type = "Colaborativo (Diario)"
                    }else if(json.lsObject[i].type == "2"){
                        json.lsObject[i].type = "Comparativo (Mensual)"
                    }else if(json.lsObject[i].type == "4"){
                        json.lsObject[i].type = "Frescura"
                    }
                }
            // Create a model and bind the table rows to this model
                let oTable = this.getView().byId("oTable");
                oTable.setModel(new JSONModel(json.lsObject),"oModel");
                if(json.lsObject != undefined && json.lsObject.length > 0){
                    oTable.setSelectedItem(oTable.getItems()[0]);
                    oTable.fireSelectionChange();
                }
                BusyIndicator.hide();	
            }
        },
        
        // //////////////////////////INICIO///////////////////////////////////////////////////////////
        loadDocInvDetails: async function(docInvId){
            BusyIndicator.show(0);
            let rowDetail = "";
            
            let docInvBean = {
                docInvId : docInvId
            } 
            const request = {
                tokenObject: null,
                lsObject:docInvBean
            };

            const json = await this.execService(InveServices.GET_DOC_INV,request,"loadDocInvDetails",this.showLog);

			if(json){
                 //console.log("docInvDetail",json.lsObject);
                 rowDetail = json.lsObject[0];
                 BusyIndicator.hide();
                return rowDetail;	
            }
            
        },
        // //////////////////////////////////FIN///////////////////////////////////////////////////
        
        deleteDocInvs: async function(object){
            BusyIndicator.show(0);
            this.eraseNotification();

            const request = {
                tokenObject: null,
                lsObject:object
            };
            const json = await this.execService(InveServices.DELETE_DOC_INV,request,"deleteDocInv",this.showLog);

			if(json){
                this.cleanView();
                this.message('Se borraron exitosamente los documentos de inventario seleccionados.',MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pInvDocument"));
                
                setTimeout(function(){	                		
                    this.byId("messagesBox").getItems()[0].close();
                }, 3000);
                
                BusyIndicator.hide();	
            }
        },
        
        getReporteDocInv: async function(){
            let StringReq = this.byId('invDocId').getValue();
            let typeDoc = this.byId("docType").getValue();
            const request = {
                tokenObject: null,
                lsObject :StringReq
            }
            const json = await this.execService(InveServices.GET_COMPLETE_COUNTED_REPORT_DIALY,request,"countReport",true);

			if(json){
                if(typeDoc !="Frescura"){
                    this.downloadXLSX(json.lsObject.positions);
                }else{
                    this.downloadFrescuraXLSX(json.lsObject.positions,StringReq);
                }
               
            }
        },

        downloadXLSX: function (modelData) {
			if(modelData == undefined || modelData.length == 0){
                MessageBox.show('Sin información para exportar.',
                        MessageBox.Icon.ERROR, "Sin datos");
                return;
            }
            let model = modelData;
            let reformattedArray;

            let typeDoc = this.byId("docType").getValue();

            if(typeDoc == "Comparativo (Mensual)"){
                
                reformattedArray = model.map(function(obj){
                    obj["Almacén"] = obj["lgort"];
                    obj["Zona"] = obj["zoneD"];
                    obj["Ubicación"] = obj["lgpla"];
                    obj["Material"] = obj["matnr"];
                    obj["Descripción"] = obj["matnrD"];
                    obj["Fecha Inicio"] = obj["dateIni"];
                    obj["Fecha Fin"] = obj["dateEnd"];
                    obj["Unidad de Medida"] = obj["measureUnit"];
                    obj["Conteo 1A"] = obj["count1A"];
                    obj["Conteo 1B"] = obj["count1B"];
                    obj["Diferencia"] = obj["dif1"];
                    obj["Conteo 2"] = obj["count2"];
                    obj["Diferencia"] = obj["dif2"];
                    obj["Conteo 3"] = obj["count3"];
                    obj["Conteo Especial"] = obj["countX"];
                    obj["Tarima"] = obj["vhilm"];
                    obj["Conteo de Tarima"] = obj["vhilmCount"];
                    obj["Fecha"] = obj["prodDate"];
                    obj["Nota"] = obj["note"];
                    obj["Lote"] = obj["lote"];
                    obj["ISC"] = obj["isc"];
                    
                    delete obj["lgort"];
                    delete obj["zoneD"];
                    delete obj["lgpla"];
                    delete obj["matnr"];
                    delete obj["matnrD"];
                    delete obj["dateIni"];
                    delete obj["dateEnd"];
                    delete obj["measureUnit"];
                    delete obj["count1A"];
                    delete obj["count1B"];
                    delete obj["dif1"];
                    delete obj["count2"];
                    delete obj["dif2"];
                    delete obj["count3"];
                    delete obj["countX"];
                    delete obj["vhilm"];
                    delete obj["vhilmCount"];
                    delete obj["prodDate"];
                    delete obj["note"];
                    delete obj["lote"];
                    delete obj["isc"];
                    delete obj["count1B"];
                    delete obj["count2"];
                    delete obj["count3"];
                    delete obj["flagColor"];
                    delete obj["lgobe"];
                    delete obj["pkAsgId"];
                    delete obj["zoneId"];
                    delete obj["build"];
                    delete obj["cpc"];
                    delete obj["cpp"];
                  
                    return obj;
                 });
                
            }else{
                
                reformattedArray = model.map(function(obj){
                    obj["Almacén"] = obj["lgort"];
                    obj["Zona"] = obj["zoneD"];
                    obj["Ubicación"] = obj["lgpla"];
                    obj["Material"] = obj["matnr"];
                    obj["Descripción"] = obj["matnrD"];
                    obj["Fecha Inicio"] = obj["dateIni"];
                    obj["Fecha Fin"] = obj["dateEnd"];
                    obj["Unidad de Medida"] = obj["measureUnit"];
                    obj["Conteo"] = obj["count1A"];
                    obj["Conteo Especial"] = obj["countX"];
                    obj["Tarima"] = obj["vhilm"];
                    obj["Conteo de Tarima"] = obj["vhilmCount"];
                    obj["Fecha"] = obj["prodDate"];
                    obj["Nota"] = obj["note"];
                    obj["Lote"] = obj["lote"];
                    
                    delete obj["lgort"];
                    delete obj["zoneD"];
                    delete obj["lgpla"];
                    delete obj["matnr"];
                    delete obj["matnrD"];
                    delete obj["dateIni"];
                    delete obj["dateEnd"];
                    delete obj["measureUnit"];
                    delete obj["count1A"];
                    delete obj["countX"];
                    delete obj["vhilm"];
                    delete obj["vhilmCount"];
                    delete obj["prodDate"];
                    delete obj["note"];
                    delete obj["lote"];
                    delete obj["count1B"];
                    delete obj["count2"];
                    delete obj["count3"];
                    delete obj["flagColor"];
                    delete obj["lgobe"];
                    delete obj["pkAsgId"];
                    delete obj["zoneId"];
                    delete obj["build"];
                    delete obj["cpc"];
                    delete obj["cpp"];
                  
                    return obj;
                 });
            }
			
			let ws = XLSX.utils.json_to_sheet(reformattedArray);
			let wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, this.byId('invDocId').getValue());
			
			XLSX.writeFile(wb, "ReporteConteo - "+this.byId('invDocId').getValue()+".xlsx");
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

        downloadCountReport: function(modelData){
            if(modelData == undefined || modelData.length == 0){
                MessageBox.show('Sin información para exportar.',
                        MessageBox.Icon.ERROR, "Sin datos");
                return;
            }
            let model = new JSONModel(modelData);
            let oExport;

            let typeDoc = this.byId("docType").getValue();
            let columnas;
            if(typeDoc == "Comparativo (Mensual)"){
                columnas = [
                    {name: "Almacén",template: {content: "{lgort}"}}
                    , {name: "Zona",template: {content: "{zoneD}"}}
                    , {name: "Ubicación", template: {content: "{lgpla}"}}
                    , {name: "Material", template: {content: "{matnr}"}}
                    , {name: "Descripción", template: {content: "{matnrD}"}}
                    , {name: "Fecha Inicio", template: {content: "{dateIni}"}}
                    , {name: "Fecha Fin", template: {content: "{dateEnd}"}}
                    , {name: "Unidad de Medida", template: { content: "{measureUnit}" }}
                    , {name: "Conteo 1A", template: { content: "{count1A}"}}
                    , {name: "Conteo 1B", template: { content: "{count1B}" }}
                    , {name: "Diferencia", template: { content: "{dif1}" }}
                    , {name: "Conteo 2", template: { content: "{count2}" }}
                    , {name: "Diferencia", template: { content: "{dif2}" }}
                    , {name: "Conteo 3", template: { content: "{count3}" }}
                    , {name: "Conteo Especial", template: { content: "{countX}" }}
                    , {name: "Tarima", template: { content: "{vhilm}"}}
                    , {name: "Conteo de Tarima", template: { content: "{vhilmCount}"}}
                    , {name: "Fecha", template: {content: "{prodDate}"}}
                    , {name: "Nota", template: {content: "{note}"}}
                    , {name: "Lote", template: {content: "{lote}"}}
                    , {name: "ISC", template: { content: "{isc}" }}
                    
                    ]
            }else{
                columnas = [
                    {name: "Almacén",template: {content: "{lgort}"}}
                    , {name: "Zona",template: {content: "{zoneD}"}}
                    , {name: "Ubicación", template: {content: "{lgpla}"}}
                    , {name: "Material", template: {content: "{matnr}"}}
                    , {name: "Descripción", template: {content: "{matnrD}"}}
                    , {name: "Fecha Inicio", template: {content: "{dateIni}"}}
                    , {name: "Fecha Fin", template: {content: "{dateEnd}"}}
                    , {name: "Unidad de Medida", template: { content: "{measureUnit}" }}
                    , {name: "Conteo", template: { content: "{count1A}"}}
                    , {name: "Conteo Especial", template: { content: "{countX}"}}
                    , {name: "Tarima", template: { content: "{vhilm}"}}
                    , {name: "Conteo de Tarima", template: { content: "{vhilmCount}"}}
                    , {name: "Fecha", template: {content: "{prodDate}"}}
                    , {name: "Nota", template: {content: "{note}"}}
                    , {name: "Lote", template: {content: "{lote}"}}
                    ]
            }
            
            oExport = new Export({

                exportType: new ExportTypeCSV({
                    fileExtension: "csv",
                    separatorChar: this.getCharSeparator()
                }),

                models: model,

                rows: {
                    path: "/"
                },
                
                columns: columnas
            });
            
            oExport.saveFile("ReporteConteo - "+this.byId('invDocId').getValue()).catch(function(oError) {
                console.error("Error al exportar csv", oError);
            }).then(function() {
                oExport.destroy();
                
            }); 
                    
        },
        
        clearTableFilters: function(){
            
            let oTable = this.byId("oTable");
            
            let oListBinding = oTable.getBinding();
              if (oListBinding) {
              oListBinding.aSorters = null;
              oListBinding.aFilters = null;
              }
              if(this.byId("oTable").getModel("oModel") != undefined){
                  oTable.getModel("oModel").refresh(true);
              }
        },

        selectRoute: function(){
            let oTableCreate = this.getView().byId('oTableCreate'); 
            let items = oTableCreate.getSelectedItems();
            if(items.length > 0){
                this.byId("bDeletePosition").setEnabled(true);
            }else{
                this.byId("bDeletePosition").setEnabled(false);
            }
        },
        
        removePositions: function(){
            
            let oTableCreate = this.getView().byId('oTableCreate');  		
            let selectedItems = oTableCreate.getSelectedItems();
            
            if(selectedItems.length > 0){
                                                        
                //Delete data
                let posicionesDeseadas = [];
                let data = oTableCreate.getModel("oCreateModel").getData();
           
                for(let i in oTableCreate.getItems()){
                    if(selectedItems.indexOf(oTableCreate.getItems()[i]) == -1 ){
					posicionesDeseadas.push(data[i]);
				    }			    			        			
			    }	    			        			
               
                oTableCreate.setModel(new JSONModel(posicionesDeseadas),"oCreateModel");
            }else{
                
                this.toast("Nada que eliminar", "20em");
            }
            
        },
        
        generateArrayDocBeans: function(){
            
            let oTableCreate = this.getView().byId('oTableCreate');
            let modelData = oTableCreate.getModel("oCreateModel").getData();
            let type = this.byId("docTypeCreate").getSelectedKey();
            let docInvBean;
            let arrDocInvBean = [];
            let pos = 0;
            
            for(let i in modelData){
                pos++;
                docInvBean = new Object();
                if(type == "2"){
                    if(!modelData[i].assignToA || !modelData[i].assignToB){
                        MessageBox.show('Posición '+pos+': Debe seleccionar contador A y contador B',
                        MessageBox.Icon.ERROR, "Faltan contadores");
                        BusyIndicator.hide();
                        return;
                    }
                    if(modelData[i].assignToA.split(" - ")[0] == modelData[i].assignToB.split(" - ")[0]){
                        MessageBox.show('Posición '+pos+': Contador A y contador B deben ser diferentes usuarios.',
                        MessageBox.Icon.ERROR, "Contadores iguales");
                        BusyIndicator.hide();
                        return;
                    }
                    docInvBean.usuarios = [{
                        entity :{
                            identyId : modelData[i].assignToA.split(" - ")[0]
                        }
                    },{
                        entity :{
                            identyId : modelData[i].assignToB.split(" - ")[0]
                        }
                    }];
                    
                }else{
                    if(!modelData[i].assignToA){
                        MessageBox.show('Posición '+pos+': Debe seleccionar contador',
                        MessageBox.Icon.ERROR, "Falta contador");
                        BusyIndicator.hide();
                        return;
                    }
                    docInvBean.usuario = {
                        entity :{
                            identyId :modelData[i].assignToA.split(" - ")[0]
                        }
                    }
                }
                

                docInvBean.bukrs = this.byId("bukrsCreate").getSelectedKey();
                docInvBean.werks = this.byId("werksCreate").getSelectedKey();
                docInvBean.route = modelData[i].routeId;
                docInvBean.type  = type;
                
                arrDocInvBean.push(docInvBean);
            }
            console.log("arrDocInvBean list generate",arrDocInvBean);
            if(arrDocInvBean.length == 0){
                
                MessageBox.show('Debe de ingresar una ruta por lo menos.',
                        MessageBox.Icon.WARNING, "Información Incompleta");
                BusyIndicator.hide();
                return;
            }else if (arrDocInvBean.length > 0){
                this.addListDocInv(arrDocInvBean, modelData);
            }
        },
        
        addListDocInv: async function(arrayDocs, modelData){
            this.backupBukrs = this.byId("bukrsCreate").getSelectedKey();
            
            const request = {
                tokenObject: null,
                lsObject:arrayDocs
            };
            
            const json = await this.execService(InveServices.ADD_LIST_DOC_INV,request,"addListDocInv",this.showLog);

			if(json){
                this.setOnEdit(false);
                let type = this.byId("docTypeCreate").getSelectedKey();            
                for(let i in modelData){
                    
                    for(let j in json.lsObject){
                        
                        if(modelData[i].routeId == json.lsObject[j].route){
                            modelData[i].docInvId = String(json.lsObject[j].docInvId);
                            if(type == "2"){
                                modelData[i].taskId = json.lsObject[j].tasks[0].taskId +" - "+json.lsObject[j].tasks[1].taskId;
                            }else{
                                modelData[i].taskId = json.lsObject[j].task.taskId;
                            }
                           
                            modelData[i].enabledUser = false;
                        }
                        
                    }
                }
                
                this.byId("oTableCreate").getModel("oCreateModel").refresh(true);
                
                this.message('Documentos de Inventario creados exitosamente.',MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pInvDocument"));
                this.byId("invDocIdCreate").setValue(json.lsObject[0].docInvRelId);
                this.byId("createdByCreate").setValue(json.lsObject[0].createdBy);
                this.byId("modifiedByCreate").setValue(json.lsObject[0].modifiedBy);
                
                BusyIndicator.hide();

                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close(); 
                }.bind(this),3000);
                
                if(json.abstractResult.resultMsgAbs != undefined && json.abstractResult.resultMsgAbs.length > 1){
                    this.message(json.abstractResult.resultMsgAbs,MessageType.Warning,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pInvDocument"));
                    setTimeout(function() {
                        this.byId("messagesBox").getItems()[0].close();
                        
                        if(json.abstractResult.resultMsgCom != undefined && json.abstractResult.resultMsgCom.length > 1){
                            this.message(json.abstractResult.resultMsgCom,MessageType.Warning,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pInvDocument"));
                            setTimeout(function() {
                                this.byId("messagesBox").getItems()[0].close();    
                            }.bind(this),10000);
                        }
                    }.bind(this),5000);
                }else{
                    if(json.abstractResult.resultMsgCom != undefined && json.abstractResult.resultMsgCom.length > 1){
                        this.message(json.abstractResult.resultMsgCom,MessageType.Warning,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pInvDocument"));
                        setTimeout(function() {
                            this.byId("messagesBox").getItems()[0].close();       
                        }.bind(this),10000);
                    }
                }
                
                this.byId("bNew").setEnabled(true);
                this.byId("bCancel").setEnabled(false);
                //this.byId("bDelete").setEnabled(false);
                this.byId("bSave").setEnabled(false);
                
                this.byId("bukrsCreate").setEnabled(false);
                this.byId("werksCreate").setEnabled(false);
                this.byId("docTypeCreate").setEnabled(false);
                this.byId("bAddPosition").setEnabled(false);
                this.setBukrsAndWerks();
                BusyIndicator.hide();	
            }
        },
        
        loadVAssignTeam: function(oEvent){
            
            this.eraseNotification();

            let sPath = oEvent.getSource().oBindingContexts.oModel.sPath;
            let oTable = this.byId("oTable");					
            this.rowAssignTeam = oTable.getModel("oModel").getObject(sPath);
            
           this.navTo('assignTeam');
        },	
      })
    }
);