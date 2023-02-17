sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageBox",
      "sap/ui/core/Fragment",
	],
	function (Controller,BusyIndicator,JSONModel,MessageBox,Fragment) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vRecountSap", {
        onInit: function() {
            // Code to execute every time view is displayed
            this.getView().addDelegate({
                
                onBeforeShow : function(evt) {                 
                    BusyIndicator.hide();
                    this.showLog = false;
                    this.setData(this.controllerConsSap().forRecountSAP_DocInvRec, this.controllerConsSap().forRecountSAP_ModelData);
                }.bind(this)
            });
                
        },

        controllerConsSap: function(){

            return sap.ui.getCore().byId('container-inveweb---vConsSap').getController();
        },

        returnAction : function() {
		
           this.controllerConsSap().flag = true;
           window.history.go(-1);
        },
        
        setData: function(docId, modelData){
            
            this.modelData = modelData;
            this.docId = docId;
            this.byId("docIdRecount").setValue(this.docId);
            
    //		console.log("modelData",this.modelData);
            
            if(!this.hideShowRecountCheck()){
                this.loadDocsSplit();
            }
            
        },
        
        loadDocsSplit: async function(){
            
            this.byId("oTable").setModel(new JSONModel([]),"oModel");
            
            let docInvBean = new Object();
            docInvBean.docInvRelId = this.docId;
            
            const request = new Object();
            request.tokenObject = null;
            request.lsObject = docInvBean;

            const json = await this.execService(InveServices.GET_DOCINV_SPLIT,request,"getDocInvSplit",this.showLog);

            if(json){
                let lsDocInvSplit = json.lsObject;
                if(lsDocInvSplit == undefined || lsDocInvSplit.length == 0){
                    MessageBox.show('Documento de Inventario '+ docInvBean.docInvRelId +' sin rutas.',
                            MessageBox.Icon.ERROR, "Error");
                    
                    BusyIndicator.hide();
                    return;
                }
                let arrRoutes = [];

                let oTable = this.byId("oTable");
               
                for(let i in lsDocInvSplit){
                    if(lsDocInvSplit[i].usuario){
                        lsDocInvSplit[i].user = lsDocInvSplit[i].usuario.entity.identyId +
                            " - "+lsDocInvSplit[i].usuario.genInf.name+" "+lsDocInvSplit[i].usuario.genInf.lastName
                    
                    }else{
                        //es tipo 2 Comparativo (Mensual)
                    }
                    arrRoutes.push(lsDocInvSplit[i].route);
                }
                oTable.setModel(new JSONModel(lsDocInvSplit),"oModel");
                
                BusyIndicator.hide();
            }
        },
        
        showModalAvailableUsers : function(oEvent) {
        
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
            _closeDialog:function(){
                this.byId("oDialogAssignTo").close();
            },
            frgById:function(id){
                return Fragment.byId(this.getView().getId(), id);
            },
            searchAsignTo: function(evt){
                if(evt.getParameters().clearButtonPressed){
                    return;
                }
                BusyIndicator.show(0);
                let search = this.frgById("fSearchAssignTo").getValue().trim();
                    if(search == "" || search.length == 0){
                        MessageBox.show('Favor de ingresar el id de red o bien el nombre y/o apellido del contador',
                                    MessageBox.Icon.ERROR, "Error");
                            BusyIndicator.hide();
                        return;
                    }
                    this.loadLDAP_Users(search);
                
            },
            loadLDAP_Users: async function (user){	
                let oTableAsignTo = this.frgById("oTableAsignTo");
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
               
                let listItems = oEvent.getParameters().listItem;
                let agreggation = listItems.mAggregations;
                let  cells = agreggation.cells;
                let row = {
                    id : cells[0].getText(),
                    desc : cells[1].getText()
                }
    
                this.userValue.setText(row.id+" - "+row.desc);
                this._closeDialog();
            },	
            loadRoute: async function(arrRoutes){
    //			console.log("lsDocInvSplit",lsDocInvSplit);
                for(let a in arrRoutes){		
                    let routeBean = new Object();
                    routeBean.routeId = arrRoutes[a];
                    routeBean.bukrs = null;
                    routeBean.werks = null;
                    routeBean.rdesc = null;
                    routeBean.type = null;
                    routeBean.BDesc = null;
                    routeBean.WDesc = null;	
                    routeBean.positions = null;
                    routeBean.groups = null;
                            
                    let request = new Object();
                    request.tokenObject = null;
                    request.lsObject = routeBean;
    
                    const json = await this.execService(InveServices.GET_ROUTES,request,"getRoutes",this.showLog);

                    if(json){
                        if(json.lsObject.length == 1){
//		            			console.log("getRoutes"+arrRoutes[a],json.lsObject);
                            let groups = json.lsObject[0].groups ;
                            let arrUsers = [];
                            let users;
//		            			
//		            			console.log("groups "+a,groups);
                            for(let i = 0; i < groups.length; i++){
                                
                                arrUsers = groups[i].users;
                                users = "";
                                for(let j = 0; j < arrUsers.length; j++){
                                    
                                    users += groups[i].groupId +" - "+ arrUsers[j].entity.identyId + " - " + arrUsers[j].genInf.name + " " + arrUsers[j].genInf.lastName
                                    if(j != arrUsers.length -1){
                                        users += "\n";
                                    }
                                }
//		            				console.log("users",users);
                                let modelData = this.byId("oTable").getModel().getData().modelData;
                                for(let k in modelData){
//			            				console.log("modelData[k].route",modelData[k].route);
//			            				console.log("arrRoutes[a]",arrRoutes[a]);
                                    if(modelData[k].route.trim().localeCompare(arrRoutes[a].trim()) == 0){
                                        modelData[k].group = users;
                                        modelData[k].groupId = groups[i].groupId;
                                        break;
                                    }
                                }
                            }
                                                            
                        }
                    }
                
                }
                this.byId("oTable").getModel("oModel").refresh();
                BusyIndicator.hide();
                        
            },
            
            changeGroup: function(groupId, groupText){
                
                let modelData = this.byId("oTable").getModel().getData().modelData;
                for(let i in modelData){
                    if(modelData[i].route == this.rowTable.route){
                        modelData[i].group = groupText;
                        modelData[i].groupId = groupId;
                        break;
                    }
                }
                this.byId("oTable").getModel().refresh();
            },
            
            addRecountSAPTaskWerks : async function() {
                
                let positionsMarked = [];
    
                // Get the records marked
                let strMatnr = "";
                for (let i in this.modelData) {
    
                    if (this.modelData[i].isc == true) {
                        positionsMarked.push(this.modelData[i].matnr);
                        
                        strMatnr = strMatnr.length < 1 ? this.modelData[i].matnr	+ "#"
                                + this.modelData[i].matnrD : strMatnr
                                + "|" + this.modelData[i].matnr
                                + "#" + this.modelData[i].matnrD;
                    }
                }
                
                let recountTable = this.byId("oTable").getModel("oModel").getData();
                let arrTaskBean = [];
                
                for(let i in recountTable){
                    if(recountTable[i].isRecount){
                        
                        let docBean = new Object();
                        docBean.docInvId = null; // va null ya que no tiene que tener Doc Inv padre
                        docBean.route =  recountTable[i].route;
                        docBean.bukrs = this.controllerConsSap().docInvRec.bukrs;
                        docBean.bukrsD = null;
                        docBean.werks = this.controllerConsSap().docInvRec.werks;
                        docBean.werksD = null;
                        docBean.type = "1";			//se deja en 1 sin importar si es diario o mensual, para que se pueda contar con un solo grupo
                        docBean.status = null;
                        docBean.createdBy = null;
                        // docBean.usuario = {
                        //     entity :{
                        //         identyId : recountTable[i].user.split(" - ")[0]
                        //     }
                        // }
                        ;
                        
                        let taskBean = new Object();
                        taskBean.taskId = null;
                        taskBean.docInvBean = docBean;
                        taskBean.taskJSON = strMatnr;
                        taskBean.groupId = recountTable[i].user.split(" - ")[0];
                        taskBean.dCreated = null;
                        taskBean.dDownlad = null;
                        taskBean.dUpload = null;
                        taskBean.status = true;
                        taskBean.rub = null;
                        taskBean.recount = "S"; 
                        
                        arrTaskBean.push(taskBean);
                    }
                }
    
                const request = new Object();
                request.tokenObject = null;
                request.lsObject = arrTaskBean;

                const json = await this.execService(InveServices.GET_SPECIAL_SAP_COUNT_LIST,request,"getSpecialSAPCountList",this.showLog);

                if(json){
                    console.log("getSpecialSAPCountList",json.lsObject);
                    this.returnAction();
                    this.controllerConsSap().closeDocumment();
                    setTimeout(function() {
                        this.toast("Se generó la tarea "+json.lsObject[0].taskId+" como conteo especial.\nFavor de descargarla en el teléfono", "20em");
                    }.bind(this),5000);
                    
                }
    
            },
                    
    ////////////////////////////////////////////INICIOrecountsapLgpla///////////////////////////////////////////////
            addRecountSAPTaskLgpla: async function() {
                
                if(this.strLgpla == undefined){
                    MessageBox.show('No se obtuvieron las ubicaciones para recontar.'
                                + response,
                                MessageBox.Icon.ERROR, "Error");
                    
                    return;
                }
                
                let recountTable = this.byId("oTable").getModel("oModel").getData();
                let arrTaskBean = [];
                
                for(let i in recountTable){
                    let docBean = new Object();
                    docBean.docInvId = null; // va null ya que no tiene que tener Doc Inv padre
                    docBean.route =  recountTable[i].route;
                    docBean.bukrs = this.controllerConsSap().docInvRec.bukrs;
                    docBean.bukrsD = null;
                    docBean.werks = this.controllerConsSap().docInvRec.werks;
                    docBean.werksD = null;
                    docBean.type = "1";			//se deja en 1 sin importar si es diario o mensual, para que se pueda contar con un solo grupo
                    docBean.status = null;
                    docBean.createdBy = null;
                    
                    let taskBean = new Object();
                    taskBean.taskId = null;
                    taskBean.docInvBean = docBean;
                    taskBean.taskJSON = this.strLgpla;
                    taskBean.groupId = recountTable[i].user.split(" - ")[0];
                    taskBean.dCreated = null;
                    taskBean.dDownlad = null;
                    taskBean.dUpload = null;
                    taskBean.status = true;
                    taskBean.rub = null;
                    taskBean.recount = "S"; 
                    
                    arrTaskBean.push(taskBean);
                }

                const request = new Object();
                request.tokenObject = null;
                request.lsObject = arrTaskBean;

                const json = await this.execService(InveServices.GET_SPECIAL_SAP_COUNT_LIST_LGPLA,request,"getSpecialSAPCountListLgpla",this.showLog);

                if(json){
                    console.log("getSpecialSAPCountListLgpla",json.lsObject);
                    this.returnAction();
                    this.controllerConsSap().closeDocumment();
                    setTimeout(function() {
                        this.toast("Se generó la tarea "+json.lsObject[0].taskId+" como conteo especial.\nYa puede descargarla en el teléfono", "20em");
                    }.bind(this),5000);
                    
                }


            },
                    ///////////////////////////////FIN recountsapLgpla//////////////////////////////////////////////////
                
            askRecountSap: function(){
                
                if(!sap.ui.getCore().byId('container-inveweb---vConsSap--chkLgpla').getState()){
                    let modelData = this.byId("oTable").getModel("oModel").getData();
                    let count = 0;
                    for(let i in modelData){
                        if(modelData[i].isRecount == true){
                            count++;
                            break;
                        }
                    }
                    
                    if(count == 0 ){
                        MessageBox.show('Se debe seleccionar por lo menos una Ruta para reconteo por centro',
                                                            MessageBox.Icon.WARNING,"Falta información");
                        
                        return;
                    }
                }
                
                // Show confirm dialog
                MessageBox.confirm("Al recontar, se cerrará el documento de inventario actual. ¿Desea continuar?",
                        {icon : MessageBox.Icon.QUESTION,
                        actions : [	MessageBox.Action.YES,
                                    MessageBox.Action.NO ],
                        onClose : function(oAction) {
                            if (oAction == 'YES') {
            
                                if(sap.ui.getCore().byId('container-inveweb---vConsSap--chkWerks').getState()){
                                    this.addRecountSAPTaskWerks();
                                }else if(sap.ui.getCore().byId('container-inveweb---vConsSap--chkLgpla').getState()){
                                        this.addRecountSAPTaskLgpla();
                                }else {
                                    MessageBox.show('No se detectó tipo de conciliación',
                                                            MessageBox.Icon.ERROR,"Falta información");
                                }
                                
                            }
                        }.bind(this)
                });
            },
                
            onSelectRecount: function(oEvent){
                
                let modelData = this.byId("oTable").getModel("oModel").getData();
                let count = 0;
                for(let i in modelData){
                    if(modelData[i].isRecount == true){
                        count++;
                        break;
                    }
                }
                
                if(count > 0){
                    this.byId("bRecount").setEnabled(true);
                }else{
                    this.byId("bRecount").setEnabled(false);
                }
            },
                
            hideShowRecountCheck: function(){
                
                if(sap.ui.getCore().byId('container-inveweb---vConsSap--chkLgpla').getState()){
                    this.byId("cIsRecount").setVisible(false);
                    this.byId("bRecount").setEnabled(true);
                    this.getRoutesLgplas();
                    return true;
                }else{
                    this.byId("cIsRecount").setVisible(true);
                    this.byId("bRecount").setEnabled(false);
                    return false;
                }
            },
                
            getRoutesLgplas: async function(){
                let oTable = this.byId("oTable");
                // Get the records marked
                let strLgpla = "";
                for (let i in this.modelData) {

                    if (this.modelData[i].isc == true && this.modelData[i].lgpla != undefined && this.modelData[i].lgpla.length > 0) {
                        
                        strLgpla = strLgpla.length < 1 ? this.modelData[i].lgpla + "#"
                                + this.modelData[i].lgort + "#" + this.modelData[i].matnr + "#" + this.modelData[i].matnrD : strLgpla
                                + "|" + this.modelData[i].lgpla
                                + "#" + this.modelData[i].lgort
                                + "#" + this.modelData[i].matnr
                                + "#" + this.modelData[i].matnrD;
                    }
                }
                
                 if(strLgpla == undefined || strLgpla ==""){
                   
                    setTimeout(function() {
                        MessageBox.show('No hay ubicaciones para recontar.',
                        MessageBox.Icon.ERROR, "Error");
                    },500);
                    return;
                } 
                this.strLgpla = strLgpla;
                let oModel = new JSONModel([]);
                oTable.setModel(oModel,"oModel");
                
                let docInvBean = new Object();
                docInvBean.docInvRelId = this.docId;
                docInvBean.route = strLgpla;
                
                const request = new Object();
                request.tokenObject = null;
                request.lsObject = docInvBean;

                const json = await this.execService(InveServices.GET_SPLIT_DOCS_TO_RECOUNT_LGPLA,request,"getSplitDocsToRecountLgpla",this.showLog);

                if(json){
                    let docsToRecount = json.lsObject;
                    if(docsToRecount == undefined || docsToRecount.length == 0){
                        MessageBox.show('No se obtuvieron documentos de inventario para recontar.',
                                MessageBox.Icon.ERROR, "Error");
                        
                        BusyIndicator.hide();
                        return;
                    }
                    
                    //let arrRoutes = [];

                    
                    for(let i in docsToRecount){
                        if(docsToRecount[i].usuario){
                            docsToRecount[i].user = docsToRecount[i].usuario.entity.identyId +
                                " - "+docsToRecount[i].usuario.genInf.name+" "+docsToRecount[i].usuario.genInf.lastName
                        
                        }else{
                            //es tipo 2 Comparativo (Mensual)
                        }
                       // arrRoutes.push(docsToRecount[i].route);
                    }
                    
                    oTable.setModel(new JSONModel(docsToRecount),"oModel");
                    //this.loadRoute(arrRoutes);
                }

            },
        })
    }
);