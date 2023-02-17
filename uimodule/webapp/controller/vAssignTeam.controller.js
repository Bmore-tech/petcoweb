sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageBox",
      "sap/ui/core/MessageType",
      "sap/ui/core/Fragment",
	],
	function (Controller,BusyIndicator,JSONModel,MessageBox,MessageType,Fragment) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vAssignTeam", {

        onInit: function() {

            this.showLog = false;
            //Code to execute every time view is displayed
            this.getView().addDelegate({
                    
                onBeforeShow: function(evt) { 
                    
                    this.cleanView();
                    try {
                        this.setData(sap.ui.getCore().byId('container-inveweb---vInvDocument').getController().rowAssignTeam);
                    } catch (error) {
                        this.navTo("Home");
                    }
                   
                    BusyIndicator.hide();			
                                    
                }.bind(this)
            });
        },
        
        setData: async function(row){
                            
            this.byId("docInvId").setText(row.docInvId);
            this.byId("docInvId").setTooltip(String(row.docInvId));
            this.byId("bukrs").setText(row.bukrs +" - "+row.bukrsD);
            this.byId("bukrs").setTooltip(row.bukrs +" - "+row.bukrsD);
            this.byId("werks").setText(row.werks+" - "+row.werksD);
            this.byId("werks").setTooltip(row.werks+" - "+row.werksD);
            this.byId("type").setText(row.type);
            this.byId("type").setTooltip(row.type);
            this.byId("status").setText(row.status);
            this.byId("status").setTooltip(row.status);
            
            if(row.type.localeCompare("Colaborativo (Diario)") == 0){
                this.byId("lblTeam1A").setText("Asignado a");
                this.byId("cTeam1B").setVisible(false);
                this.byId("cTeam2").setVisible(false);
                this.byId("cTeam3").setVisible(false);
                this.byId("cTeamX").setVisible(false);
            }else{
                this.byId("lblTeam1A").setText("Conteo 1A");
                this.byId("cTeam1B").setVisible(true);
            }
            
            this.row = row;	
            await this.loadDocsSplit();	
                            
        },
        
        cleanView: function(){
            
            this.byId("docInvId").setText(null);
            this.byId("bukrs").setText(null);
            this.byId("werks").setText(null);
            this.byId("type").setText(null);
            this.byId("routeId").setText(null);
            this.byId("rdesc").setText(null);
            this.byId("zoneArea").setValue(null);
                    	
            this.byId("oTable").setModel(new JSONModel([]),"oModel");
            this.infoRecord = {};
        },
                
        returnAction : function() {
            
            sap.ui.getCore().byId('container-inveweb---vInvDocument').getController().fromvAssignTeam = true;
            window.history.go(-1);
        },
        
        eraseNotification : function() {
            this.byId("vbFrame").setVisible(false);	
        },
                    
        selectRow: function(oEvent){
    //		Tiene que seleccionar el link para que se actualice la ruta
            let sPath = oEvent.getSource().oBindingContexts.oModel.sPath;
            let oTable = this.byId("oTable");					
            let row = oTable.getModel("oModel").getObject(sPath);
            
            this.byId("routeId").setText(row.routeId);
            this.byId("rdesc").setText(row.rdesc);
            this.getZoneInfoByRouteId(row.routeId);
    
        },
        
        loadDocsSplit: async function(){
            
            this.byId("oTable").setModel(new JSONModel([]),"oModel");
            
            let docInvBean = {
                docInvRelId : this.row.docInvId
            }

            const request = {
                tokenObject: null,
                lsObject:docInvBean
            };

           const json = await this.execService(InveServices.GET_DOCINV_SPLIT,request,"loadDocsSplit",this.showLog);

           if(json){
            this.lsDocInvSplit = json.lsObject;
            if(this.lsDocInvSplit == undefined || this.lsDocInvSplit.length == 0){
                
                MessageBox.show('Documento de Inventario '+ docInvBean.docInvRelId +' sin rutas.',
                        MessageBox.Icon.ERROR, "Error");
                
                BusyIndicator.hide();
                return;
            }
            let arrRoutes = [];
            let objByDocId;
            this.arrObjByDocId = [];
            let arrDocId = "";
            let listDocs = [];
            let listTasks = [];
            let mapMonth = new Map();
            for(let i in this.lsDocInvSplit){
                arrRoutes.push(this.lsDocInvSplit[i].route);
                
                objByDocId = new Object();
                objByDocId.docInvId = this.lsDocInvSplit[i].docInvId;
                objByDocId.routeId = this.lsDocInvSplit[i].route;
                objByDocId.taskId = this.lsDocInvSplit[i].task.taskId;
                objByDocId.createdTaskDate = this.formatDate(new Date(this.lsDocInvSplit[i].task.dCreated));
                objByDocId.uploadTaskDate = this.lsDocInvSplit[i].task.dUpload != 0 ? this.formatDate(new Date(this.lsDocInvSplit[i].task.dUpload)) : "¿Forzar cierre de tarea?";
                if(this.row.type.localeCompare("Comparativo (Mensual)") != 0){
                    objByDocId.team1A = this.lsDocInvSplit[i].usuario.entity.identyId +
                        " - "+this.lsDocInvSplit[i].usuario.genInf.name+" "+this.lsDocInvSplit[i].usuario.genInf.lastName;
                

                    if(this.lsDocInvSplit[i].task.dUpload != undefined && this.lsDocInvSplit[i].task.dUpload != 0){
                
                        objByDocId.enableTeam1A = false;
                        objByDocId.enableUploadDate = false;
                        if(this.lsDocInvSplit[i].task.forcedClose){
                            objByDocId.state = "Warning";// tarea ya concluida
                            objByDocId.icon = "sap-icon://alert";
                            objByDocId.textClose = "Cierre forzado";
                            objByDocId.enableTeam1A = false;
                        }else if(this.lsDocInvSplit[i].task.dUpload - this.lsDocInvSplit[i].task.dCreated < 0){
                            objByDocId.state = "Error";//tarea sin concluir
                            objByDocId.icon = "sap-icon://error";
                            objByDocId.textClose = "Expirado";
                            objByDocId.enableTeam1A = false;
                            objByDocId.enableUploadDate = false;
                            objByDocId.uploadTaskDate = "Cerrado por sistema"
                        }else{
                            objByDocId.state = "Success";// tarea ya concluida
                            objByDocId.icon = "sap-icon://accept";
                            objByDocId.textClose = "Contado";
                            objByDocId.enableTeam1A = false;
                        }
                        
                    }else{
                        
                        let diff = new Date() - new Date(this.lsDocInvSplit[i].task.dCreated);
                        const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
                        
                        if(diffDays >= 0.5){
                            objByDocId.state = "Error";//tarea sin concluir
                            objByDocId.icon = "sap-icon://error";
                            objByDocId.textClose = "Expirado";
                            objByDocId.enableTeam1A = false;
                            objByDocId.enableUploadDate = false;
                        }else{
                            objByDocId.state = "Information";//tarea sin concluir
                            objByDocId.icon = "sap-icon://information";
                            objByDocId.textClose = "Activo";
                            objByDocId.enableTeam1A = true;
                            objByDocId.enableUploadDate = true;
                        }
                        
                    }
        
                }else{
                    //Es documento tipo 2 Comparativo (Mensual) (mensual)
                    if(mapMonth.get(this.lsDocInvSplit[i].docInvId)){
                        listTasks.push(this.lsDocInvSplit[i].task.taskId);
                        mapMonth.get(this.lsDocInvSplit[i].docInvId).set(this.lsDocInvSplit[i].task.taskId,this.lsDocInvSplit[i].usuario);
                    }else{
                        listDocs.push(this.lsDocInvSplit[i].docInvId);
                        listTasks.push(this.lsDocInvSplit[i].task.taskId);
                        mapMonth.set(this.lsDocInvSplit[i].docInvId,new Map());
                        mapMonth.get(this.lsDocInvSplit[i].docInvId).set(this.lsDocInvSplit[i].task.taskId,this.lsDocInvSplit[i].usuario);
                    }
                    objByDocId.taskMonth = this.lsDocInvSplit[i].task;
                }
                
                arrDocId.length == 0 ? arrDocId = this.lsDocInvSplit[i].docInvId : arrDocId += ","+this.lsDocInvSplit[i].docInvId;

                this.arrObjByDocId.push(objByDocId);
            }
            
            let flagTeam2 = false;
            let flagTeam3 = false;
            for(let i in listDocs){
                for(let j=0; j< listTasks.length; j++){
                   let usuario = mapMonth.get(listDocs[i]).get(listTasks[j]);
                   
                   switch(j){
                        case 0: for(let k in this.arrObjByDocId){
                                    if(this.arrObjByDocId[k].taskId == listTasks[j]){
                                        this.arrObjByDocId[k].team1A = usuario.entity.identyId +
                                            " - "+usuario.genInf.name+" "+usuario.genInf.lastName;
                                        if(this.arrObjByDocId[k].taskMonth.dUpload != undefined && this.arrObjByDocId[k].taskMonth.dUpload != 0){
            
                                            this.arrObjByDocId[k].enableTeam1A = false;
                                            this.arrObjByDocId[k].enableUploadDate = false;
                                            if(this.arrObjByDocId[k].taskMonth.forcedClose){
                                                this.arrObjByDocId[k].state = "Warning";// tarea ya concluida
                                                this.arrObjByDocId[k].icon = "sap-icon://alert";
                                                this.arrObjByDocId[k].textClose = "Cierre forzado";
                                                this.arrObjByDocId[k].enableTeam1A = false;
                                            }else if(this.arrObjByDocId[k].taskMonth.dUpload - this.arrObjByDocId[k].taskMonth.dCreated < 0){
                                                this.arrObjByDocId[k].state = "Error";//tarea sin concluir
                                                this.arrObjByDocId[k].icon = "sap-icon://error";
                                                this.arrObjByDocId[k].textClose = "Expirado";
                                                this.arrObjByDocId[k].enableTeam1A = false;
                                                this.arrObjByDocId[k].enableUploadDate = false;
                                                this.arrObjByDocId[k].uploadTaskDate = "Cerrado por sistema"
                                            }else{
                                                this.arrObjByDocId[k].state = "Success";// tarea ya concluida
                                                this.arrObjByDocId[k].icon = "sap-icon://accept";
                                                this.arrObjByDocId[k].textClose = "Contado";
                                                this.arrObjByDocId[k].enableTeam1A = false;
                                            }
                                            
                                        }else{
                                            
                                            let diff = new Date() - new Date(this.arrObjByDocId[k].taskMonth.dCreated);
                                            const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
                                            //console.log("diffDays",diffDays);
                                            if(diffDays >= 1){
                                                this.arrObjByDocId[k].state = "Error";//tarea sin concluir
                                                this.arrObjByDocId[k].icon = "sap-icon://error";
                                                this.arrObjByDocId[k].textClose = "Expirado";
                                                this.arrObjByDocId[k].enableTeam1A = false;
                                                this.arrObjByDocId[k].enableUploadDate = false;
                                            }else{
                                                this.arrObjByDocId[k].state = "Information";//tarea sin concluir
                                                this.arrObjByDocId[k].icon = "sap-icon://information";
                                                this.arrObjByDocId[k].textClose = "Activo";
                                                this.arrObjByDocId[k].enableTeam1A = true;
                                                this.arrObjByDocId[k].enableUploadDate = true;
                                            }
                                            
                                        }
                                            break;
                                    }
                                }
                        break;
                        case 1: for(let k in this.arrObjByDocId){
                                    if(this.arrObjByDocId[k].taskId == listTasks[j]){
                                        this.arrObjByDocId[k].team1B = usuario.entity.identyId +
                                            " - "+usuario.genInf.name+" "+usuario.genInf.lastName;
                                        if(this.arrObjByDocId[k].taskMonth.dUpload != undefined && this.arrObjByDocId[k].taskMonth.dUpload != 0){
        
                                            this.arrObjByDocId[k].enableTeam1B = false;
                                            this.arrObjByDocId[k].enableUploadDate = false;
                                            if(this.arrObjByDocId[k].taskMonth.forcedClose){
                                                this.arrObjByDocId[k].state = "Warning";// tarea ya concluida
                                                this.arrObjByDocId[k].icon = "sap-icon://alert";
                                                this.arrObjByDocId[k].textClose = "Cierre forzado";
                                                this.arrObjByDocId[k].enableTeam1B = false;
                                            }else if(this.arrObjByDocId[k].taskMonth.dUpload - this.arrObjByDocId[k].taskMonth.dCreated < 0){
                                                this.arrObjByDocId[k].state = "Error";//tarea sin concluir
                                                this.arrObjByDocId[k].icon = "sap-icon://error";
                                                this.arrObjByDocId[k].textClose = "Expirado";
                                                this.arrObjByDocId[k].enableTeam1B = false;
                                                this.arrObjByDocId[k].enableUploadDate = false;
                                                this.arrObjByDocId[k].uploadTaskDate = "Cerrado por sistema"
                                            }else{
                                                this.arrObjByDocId[k].state = "Success";// tarea ya concluida
                                                this.arrObjByDocId[k].icon = "sap-icon://accept";
                                                this.arrObjByDocId[k].textClose = "Contado";
                                                this.arrObjByDocId[k].enableTeam1B = false;
                                            }
                                            
                                        }else{
                                            
                                            let diff = new Date() - new Date(this.arrObjByDocId[k].taskMonth.dCreated);
                                            const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
                                            //console.log("diffDays",diffDays);
                                            if(diffDays >= 1){
                                                this.arrObjByDocId[k].state = "Error";//tarea sin concluir
                                                this.arrObjByDocId[k].icon = "sap-icon://error";
                                                this.arrObjByDocId[k].textClose = "Expirado";
                                                this.arrObjByDocId[k].enableTeam1B = false;
                                                this.arrObjByDocId[k].enableUploadDate = false;
                                            }else{
                                                this.arrObjByDocId[k].state = "Information";//tarea sin concluir
                                                this.arrObjByDocId[k].icon = "sap-icon://information";
                                                this.arrObjByDocId[k].textClose = "Activo";
                                                this.arrObjByDocId[k].enableTeam1B = true;
                                                this.arrObjByDocId[k].enableUploadDate = true;
                                            }
                                            
                                        }
                                            break;
                                    }
                                }
                        break;
                        case 2: for(let k in this.arrObjByDocId){
                                    if(this.arrObjByDocId[k].taskId == listTasks[j]){
                                        this.arrObjByDocId[k].team2 = usuario.entity.identyId +
                                            " - "+usuario.genInf.name+" "+usuario.genInf.lastName;
                                            flagTeam2 = true;

                                            if(this.arrObjByDocId[k].taskMonth.dUpload != undefined && this.arrObjByDocId[k].taskMonth.dUpload != 0){
        
                                                this.arrObjByDocId[k].enableTeam2 = false;
                                                this.arrObjByDocId[k].enableUploadDate = false;
                                                if(this.arrObjByDocId[k].taskMonth.forcedClose){
                                                    this.arrObjByDocId[k].state = "Warning";// tarea ya concluida
                                                    this.arrObjByDocId[k].icon = "sap-icon://alert";
                                                    this.arrObjByDocId[k].textClose = "Cierre forzado";
                                                    this.arrObjByDocId[k].enableTeam2 = false;
                                                }else if(this.arrObjByDocId[k].taskMonth.dUpload - this.arrObjByDocId[k].taskMonth.dCreated < 0){
                                                    this.arrObjByDocId[k].state = "Error";//tarea sin concluir
                                                    this.arrObjByDocId[k].icon = "sap-icon://error";
                                                    this.arrObjByDocId[k].textClose = "Expirado";
                                                    this.arrObjByDocId[k].enableTeam2 = false;
                                                    this.arrObjByDocId[k].enableUploadDate = false;
                                                    this.arrObjByDocId[k].uploadTaskDate = "Cerrado por sistema"
                                                }else{
                                                    this.arrObjByDocId[k].state = "Success";// tarea ya concluida
                                                    this.arrObjByDocId[k].icon = "sap-icon://accept";
                                                    this.arrObjByDocId[k].textClose = "Contado";
                                                    this.arrObjByDocId[k].enableTeam2 = false;
                                                }
                                                
                                            }else{
                                                
                                                let diff = new Date() - new Date(this.arrObjByDocId[k].taskMonth.dCreated);
                                                const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                //console.log("diffDays",diffDays);
                                                if(diffDays >= 1){
                                                    this.arrObjByDocId[k].state = "Error";//tarea sin concluir
                                                    this.arrObjByDocId[k].icon = "sap-icon://error";
                                                    this.arrObjByDocId[k].textClose = "Expirado";
                                                    this.arrObjByDocId[k].enableTeam2 = false;
                                                    this.arrObjByDocId[k].enableUploadDate = false;
                                                }else{
                                                    this.arrObjByDocId[k].state = "Information";//tarea sin concluir
                                                    this.arrObjByDocId[k].icon = "sap-icon://information";
                                                    this.arrObjByDocId[k].textClose = "Activo";
                                                    this.arrObjByDocId[k].enableTeam2 = true;
                                                    this.arrObjByDocId[k].enableUploadDate = true;
                                                }
                                                
                                            }                                        
                                            break;
                                    }
                                }
                        break;
                        case 3: for(let k in this.arrObjByDocId){
                                    if(this.arrObjByDocId[k].taskId == listTasks[j]){
                                        this.arrObjByDocId[k].team3 = usuario.entity.identyId +
                                            " - "+usuario.genInf.name+" "+usuario.genInf.lastName;
                                            flagTeam3 = true;

                                        if(this.arrObjByDocId[k].taskMonth.dUpload != undefined && this.arrObjByDocId[k].taskMonth.dUpload != 0){
    
                                            this.arrObjByDocId[k].enableTeam3 = false;
                                            this.arrObjByDocId[k].enableUploadDate = false;
                                            if(this.arrObjByDocId[k].taskMonth.forcedClose){
                                                this.arrObjByDocId[k].state = "Warning";// tarea ya concluida
                                                this.arrObjByDocId[k].icon = "sap-icon://alert";
                                                this.arrObjByDocId[k].textClose = "Cierre forzado";
                                                this.arrObjByDocId[k].enableTeam3 = false;
                                            }else if(this.arrObjByDocId[k].taskMonth.dUpload - this.arrObjByDocId[k].taskMonth.dCreated < 0){
                                                this.arrObjByDocId[k].state = "Error";//tarea sin concluir
                                                this.arrObjByDocId[k].icon = "sap-icon://error";
                                                this.arrObjByDocId[k].textClose = "Expirado";
                                                this.arrObjByDocId[k].enableTeam3 = false;
                                                this.arrObjByDocId[k].enableUploadDate = false;
                                                this.arrObjByDocId[k].uploadTaskDate = "Cerrado por sistema"
                                            }else{
                                                this.arrObjByDocId[k].state = "Success";// tarea ya concluida
                                                this.arrObjByDocId[k].icon = "sap-icon://accept";
                                                this.arrObjByDocId[k].textClose = "Contado";
                                                this.arrObjByDocId[k].enableTeam3 = false;
                                            }
                                            
                                        }else{
                                            
                                            let diff = new Date() - new Date(this.arrObjByDocId[k].taskMonth.dCreated);
                                            const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
                                            //console.log("diffDays",diffDays);
                                            if(diffDays >= 1){
                                                this.arrObjByDocId[k].state = "Error";//tarea sin concluir
                                                this.arrObjByDocId[k].icon = "sap-icon://error";
                                                this.arrObjByDocId[k].textClose = "Expirado";
                                                this.arrObjByDocId[k].enableTeam3 = false;
                                                this.arrObjByDocId[k].enableUploadDate = false;
                                            }else{
                                                this.arrObjByDocId[k].state = "Information";//tarea sin concluir
                                                this.arrObjByDocId[k].icon = "sap-icon://information";
                                                this.arrObjByDocId[k].textClose = "Activo";
                                                this.arrObjByDocId[k].enableTeam3 = true;
                                                this.arrObjByDocId[k].enableUploadDate = true;
                                            }
                                            
                                        }                                            
                                            break;
                                    }
                                }
                        break;
                        default:console.error("Escenario desconocido");
                   }
                }

            }
            if(flagTeam2){
                this.byId("cTeam2").setVisible(true);
            }else{
                this.byId("cTeam2").setVisible(false);
            }
            if(flagTeam3){
                this.byId("cTeam3").setVisible(true);
            }else{
                this.byId("cTeam3").setVisible(false);
            }
            this.byId("oTable").setModel(new JSONModel(this.arrObjByDocId),"oModel");
            
            this.loadRoute(arrRoutes);
           }
            
        },
        
        loadRoute: async function(arrRoutes){
    
            for(let a in arrRoutes){		
                let routeBean = new Object();
                routeBean.routeId = arrRoutes[a];
                
                const request = {
                    tokenObject: null,
                    lsObject:routeBean
                };   

                const json = await this.execService(InveServices.GET_ROUTES,request,"loadRoute",this.showLog);
                if(json){
                    if(json.lsObject.length > 0){
                        
                        let infoRoute = json.lsObject;
                        this.byId("routeId").setText(infoRoute[0].routeId);
                        this.byId("rdesc").setText(infoRoute[0].rdesc);
                       
                       for(let i in infoRoute){
                        let zone = "";
                        for(let j in infoRoute[i].positions){
                            zone += infoRoute[i].positions[j].zoneId +" - "+infoRoute[i].positions[j].zdesc+
                                " - Almacén "+infoRoute[i].positions[j].lgort+"\r\n";
                           }
                        this.byId("zoneArea").setValue(zone);
                       }
                        
                    }
                }
                
            }
                    
        },
        
        handleTeam1A: function(e){
            let cells = e.getSource().getParent().mAggregations.cells;
            this.infoRecord.docInvId = cells[0].getText();
            this.infoRecord.taskId = cells[1].getText();
            this.infoRecord.createdTaskDate = cells[2].getText();
            this.infoRecord.uploadTaskDate = cells[3].getText();
            this.infoRecord.team1A = cells[4].getText();
            this.infoRecord.team1B = cells[5].getText();
            this.infoRecord.team2 = cells[6].getText();
            this.infoRecord.team3 = cells[7].getText();
            this.infoRecord.teamX = cells[8].getText();
            this.infoRecord.state = cells[9].getState();
            
            let msgConfirm = "¿Desea cambiar la asignación " + e.getSource().getText() + " ?";
             MessageBox.confirm( msgConfirm, {
                          icon: MessageBox.Icon.QUESTION,
                          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                          onClose: function(oAction) { 
                              
                            if(oAction == 'YES'){
                                this.changeTeam(this.infoRecord.team1A);
                            }  			        	  			        	  
                        }.bind(this)						
                    }
                );
            
        },
        handleTeam1B: function(e){
            let cells = e.getSource().getParent().mAggregations.cells;
            this.infoRecord.docInvId = cells[0].getText();
            this.infoRecord.taskId = cells[1].getText();
            this.infoRecord.createdTaskDate = cells[2].getText();
            this.infoRecord.uploadTaskDate = cells[3].getText();
            this.infoRecord.team1A = cells[4].getText();
            this.infoRecord.team1B = cells[5].getText();
            this.infoRecord.team2 = cells[6].getText();
            this.infoRecord.team3 = cells[7].getText();
            this.infoRecord.teamX = cells[8].getText();
            this.infoRecord.state = cells[9].getState();
           
             MessageBox.confirm(
                "¿Desea cambiar la asignación " + e.getSource().getText() + " ?", {
                          icon: MessageBox.Icon.QUESTION,
                          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                          onClose: function(oAction) { 
                              
                            if(oAction == 'YES'){
                                this.changeTeam(this.infoRecord.team1B);
                            }  			        	  			        	  
                        }.bind(this)						
                    }
                );	
            
        },
        handleTeam2: function(e){
            let cells = e.getSource().getParent().mAggregations.cells;
            this.infoRecord.docInvId = cells[0].getText();
            this.infoRecord.taskId = cells[1].getText();
            this.infoRecord.createdTaskDate = cells[2].getText();
            this.infoRecord.uploadTaskDate = cells[3].getText();
            this.infoRecord.team1A = cells[4].getText();
            this.infoRecord.team1B = cells[5].getText();
            this.infoRecord.team2 = cells[6].getText();
            this.infoRecord.team3 = cells[7].getText();
            this.infoRecord.teamX = cells[8].getText();
            this.infoRecord.state = cells[9].getState();
            //console.log("this.infoRecord Team 2",this.infoRecord);
             MessageBox.confirm(
                "¿Desea cambiar la asignación " + e.getSource().getText() + " ?", {
                          icon: MessageBox.Icon.QUESTION,
                          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                          onClose: function(oAction) { 
                              
                            if(oAction == 'YES'){
                                this.changeTeam("2 - "+this.infoRecord.team2);
                            }  			        	  			        	  
                        }.bind(this)						
                    }
                );	
            
        },
        handleTeam3: function(e){
            let cells = e.getSource().getParent().mAggregations.cells;
            this.infoRecord.docInvId = cells[0].getText();
            this.infoRecord.taskId = cells[1].getText();
            this.infoRecord.createdTaskDate = cells[2].getText();
            this.infoRecord.uploadTaskDate = cells[3].getText();
            this.infoRecord.team1A = cells[4].getText();
            this.infoRecord.team1B = cells[5].getText();
            this.infoRecord.team2 = cells[6].getText();
            this.infoRecord.team3 = cells[7].getText();
            this.infoRecord.teamX = cells[8].getText();
            this.infoRecord.state = cells[9].getState();
            //console.log("this.infoRecord Team 3",this.infoRecord);
            MessageBox.confirm(
                "¿Desea cambiar la asignación " + e.getSource().getText() + " ?", {
                          icon: MessageBox.Icon.QUESTION,
                          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                          onClose: function(oAction) { 
                              
                            if(oAction == 'YES'){
                                this.changeTeam("3 - "+this.infoRecord.team3);
                            }  			        	  			        	  
                        }.bind(this)						
                    }
                );
            
        },
        
        handleTeamX: function(e){
            let cells = e.getSource().getParent().mAggregations.cells;
            this.infoRecord.docInvId = cells[0].getText();
            this.infoRecord.taskId = cells[1].getText();
            this.infoRecord.createdTaskDate = cells[2].getText();
            this.infoRecord.uploadTaskDate = cells[3].getText();
            this.infoRecord.team1A = cells[4].getText();
            this.infoRecord.team1B = cells[5].getText();
            this.infoRecord.team2 = cells[6].getText();
            this.infoRecord.team3 = cells[7].getText();
            this.infoRecord.teamX = cells[8].getText();
            this.infoRecord.state = cells[9].getState();
            //console.log("this.infoRecord Team X",this.infoRecord);
            MessageBox.confirm(
                "¿Desea cambiar la asignación " + e.getSource().getText() + " ?", {
                          icon: MessageBox.Icon.QUESTION,
                          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                          onClose: function(oAction) { 
                              
                            if(oAction == 'YES'){
                                this.changeTeam("X - "+this.infoRecord.teamX);
                            }  			        	  			        	  
                        }.bind(this)						
                    }
                );
            
        },
        frgById:function(id){
            return Fragment.byId(this.getView().getId(), id);
        },
            
        changeTeam: function(flagTeam){	
            this.flagTeam = flagTeam;
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

            BusyIndicator.show(0);
                if(!this.flagTeam.includes("INVGRP")){
                   //Es Colaborativo (Diario)
                    let data;
                    try {
                        data = this.byId("oTable").getModel("oModel").getData();
                    } catch (e) {
                        data = [];						
                    }
                    
                    for(let i in data){
                        if(data[i].team1A && data[i].team1A.split(" - ")[0] == row.id){
                            MessageBox.show('El usuario '+row.id+' ya se encuentra asignado a la tarea '+data[i].taskId,
                                    MessageBox.Icon.ERROR, "Error");
                            BusyIndicator.hide();
                            return;
                        }
                        if(data[i].team1B && data[i].team1B.split(" - ")[0] == row.id){
                            MessageBox.show('El usuario '+row.id+' ya se encuentra asignado a la tarea '+data[i].taskId,
                                    MessageBox.Icon.ERROR, "Usuario duplicado");
                            BusyIndicator.hide();
                            return;
                        }
                        
                    }
                    //logica para actualizar usuario
                    //console.log("row user",row);
                    this.updateUserInTask(row.id);
                }
            		
        },	
        updateUserInTask: async function(userId){
			
			let taskBean = new Object();
			let docInvBean = new Object();
			
			taskBean.groupId = userId;
            taskBean.taskId = this.infoRecord.taskId;
			docInvBean.docInvId = this.infoRecord.docInvId;
			taskBean.docInvBean = docInvBean;

            const request = {
                tokenObject: null,
                lsObject:taskBean
            };
            const json = await this.execService(InveServices.CHANGE_ASSIGNED_TO_IN_TASK,request,"updateUserInTask",this.showLog);

			if(json){
               await this.loadDocsSplit();
						
                setTimeout(function() {
                    this.message('Se asignó exitosamente el usuario '+userId
                            +'\nTarea: '+this.infoRecord.taskId+'\nDocumento interno: '+this.infoRecord.docInvId,
                            MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pAssignTeam"));
                    
                            setTimeout(function() {
                        this.byId("messagesBox").getItems()[0].close();
                    }.bind(this),7500);
                }.bind(this),3500);
                
                this._closeDialog(); 
                BusyIndicator.hide();
            }
			
		},
        _closeDialog:function(){
            this.byId("oDialogAssignTo").close();
        },
        
        getZoneInfoByRouteId: async function(routeId){
            
            const request = {
                tokenObject: null,
                lsObject:routeId
            };

            const json = await this.execService(InveServices.GET_ZONE_INFO_BY_ROUTE_ID,request,"getZoneInfoByRouteId",this.showLog);
                if(json){
                    let zones = json.lsObject;
                    let zonas = "";
                    for(let i in zones){
                        zonas += zones[i].zoneId +" - " + zones[i].zdesc +" - Almacén " + zones[i].lgort + "\r\n";
                    }
                    
                    this.byId("zoneArea").setValue(zonas);
                    BusyIndicator.hide();
                }
            
        },

        concludeTask: function(e){
            let cells = e.getSource().getParent().mAggregations.cells;
            this.infoRecord.docInvId = cells[0].getText();
            this.infoRecord.taskId = cells[1].getText();
            this.infoRecord.createdTaskDate = cells[2].getText();
            this.infoRecord.uploadTaskDate = cells[3].getText();
            this.infoRecord.team1A = cells[4].getText();
            this.infoRecord.team1B = cells[5].getText();
            this.infoRecord.team2 = cells[6].getText();
            this.infoRecord.team3 = cells[7].getText();
            this.infoRecord.teamX = cells[8].getText();
            this.infoRecord.state = cells[9].getState();
            //console.log("infoRecord",this.infoRecord);
            MessageBox.confirm(
                "La tarea será registrada con los siguientes datos:\n\n* Cierre forzado por: "+this.getUserId()+" - "+this.getUserFullName()+
                "\n* Tarea vacía\n\n¿Desea forzar el cierre de la tarea?", {
                     icon: MessageBox.Icon.QUESTION,
                     actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                     onClose: function(oAction) { 
                         
                       if(oAction == 'YES'){
                           this.execConcludeTask();
                       }  			        	  			        	  
                   }.bind(this)						
               }
           );
        },

        execConcludeTask: async function(){
            let taskBean = new Object();
			let docInvBean = new Object();
			
            taskBean.taskId = this.infoRecord.taskId;
			docInvBean.docInvId = this.infoRecord.docInvId;
			taskBean.docInvBean = docInvBean;
            
            const request = {
                tokenObject: null,
                lsObject:taskBean
            };
            
            const json = await this.execService(InveServices.FORCED_CONCLUDE_TASK,request,"execConcludeTask",this.showLog);
                if(json){
                    this.loadDocsSplit();
						
                    setTimeout(function() {
                        this.message('Tarea '+this.infoRecord.taskId+' cerrada exitosamente ',MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pAssignTeam"));
                        
                        setTimeout(function() {
                            this.byId("messagesBox").getItems()[0].close();
                        }.bind(this),6500);
                    }.bind(this),1500);
                }	
        },
      })
    }
);