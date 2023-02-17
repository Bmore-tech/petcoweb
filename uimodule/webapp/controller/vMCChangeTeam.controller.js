sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/Fragment",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageBox",
	],
	function (Controller,Fragment,BusyIndicator,JSONModel,MessageBox) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vMCChangeTeam", {
	
		setControlSettings: function(idFrgGroups, oDialog, oTable, infoRecord, flagTeam){
			
			this.idFrgGroups = idFrgGroups;
			this.oDialog = oDialog;
			this.oTable = oTable;
			this.infoRecord = infoRecord;
			this.flagTeam = flagTeam;
			console.log("infoRecord",this.infoRecord);
			console.log("flagTeam",this.flagTeam);
			this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
		},

		loadGroups: async function(){					
			let oTableGroups = Fragment.byId(this.idFrgGroups, "oTableGroups");
			let search = Fragment.byId(this.idFrgGroups, "fSearchGroup").getValue();						 
			oTableGroups.setModel(new JSONModel([]),"ofrgModel");
			
			let bukrs_ = null; 
			let werks_ = null; 
			
			if(!this.ADMIN_ROLE){
				
				bukrs_ = this.getBukrs();
				werks_ = this.getWerks();
			}
			
			let groupBean = {
				bukrs : bukrs_,
				werks : werks_
			}	
							
			let lsObject = [];
			lsObject.push(groupBean);
			lsObject.push(search);
			
			const request = {
				tokenObject: null,
				lsObject: lsObject
			};

			const json = await this.execService(InveServices.GET_ONLY_GROUPS,request,"loadGroups",this.showLog);

			if(json){
				//Create a model and bind the table rows to this model           		            		
				oTableGroups.setModel(new JSONModel(json.lsObject), "ofrgModel");
				BusyIndicator.hide();
			}
		},
		
		selectGroup: function(oEvent){
			
			let index = oEvent.getParameter("rowIndex");
			let oTableGroups = Fragment.byId(this.idFrgGroups, "oTableGroups");
			let sPath = oTableGroups.getContextByIndex(index).getPath();
			let row = oTableGroups.getModel().getObject(sPath);
			let groupId = row.groupId;
			
			if(groupId == this.flagTeam.split(" - ")[1]){//Seleccionando mismo grupo que se quiere cambiar
				MessageBox.show('Mismo grupo asignado.',
						MessageBox.Icon.ERROR, "Error");
				
				return;
			}
			
			this.getGroup(groupId);		
		},	
		
		getGroup: async function(groupId){		
			
			const request = {
				tokenObject: null,
				lsObject: groupId
			};
			const json = await this.execService(InveServices.GET_GROUPS,request,"getGroup",this.showLog);

			if(json){
				let group = json.lsObject[0];
				this.setData(group); 
				BusyIndicator.hide();
			}
		},
		
		setData: function(group){
			
			if(this.flagTeam.split(" - ")[0] == "X"){
				this.updateRouteGroup(group.groupId);
				return;
			}
			
			let data;
			
			try {
				data = this.oTable.getModel("ofrgModel").getData();
			} catch (e) {
				data = [];						
			}
			
			/////INI Verificar si es tipo Diario/////
			if(this.infoRecord.group1B == undefined){// Es Colaborativo (Diario)
				for(let i in data){
					if(data[i].state == "Error"){
						if(data[i].group1A == group.groupId){
							MessageBox.show('El grupo '+group.groupId+' ya se encuentra asignado al documento interno '+data[i].docInvId,
									MessageBox.Icon.ERROR, "Error");
							
							return;
						}
					}
					
				}
				//Verificar que el usuario no exista en alguno grupo asignado
				for(let i in data){
					if(data[i].state == "Error"){
						let arrUserIn = data[i].lsUsers1A;
						let arrUser = group.users;
						for(let j in arrUser){
							for(let k in arrUserIn){
								if(arrUser[j].entity.identyId == arrUserIn[k].entity.identyId){
									MessageBox.show('Usuario: ' + arrUser[j].entity.identyId + 
											' se encuentra en el grupo '+data[i].group1A+' asignado al documento interno '+data[i].docInvId+'.',
											MessageBox.Icon.ERROR, "Error");
									return;
								}
							}
							
						}
					}
					
				}
			}else{// Es  Comparativo (Mensual)
				
				//Un grupo no puede contar nuevamente en los conteos siguientes sino hasta el especial
				for(let j in data){
					if(data[j].group1A == group.groupId || data[j].group1B == group.groupId
							|| (data[j].group2 != undefined && data[j].group2 == group.groupId
									||(data[j].group3 != undefined && data[j].group3 == group.groupId))){
						
						MessageBox.show('Grupo: ' + group.groupId + 
								' ya asignado en el documento interno '+data[j].docInvId+'.',
								MessageBox.Icon.ERROR, "Error");
						return;
					}
				}
				

	//			Verificando que el grupo nominado no tenga usuarios que ya esten asignados
				for(let j in data){
					let arrUserIn1A = data[j].lsUsers1A;
					let arrUserIn1B = data[j].lsUsers1B;
					let arrUserIn2 = data[j].lsUsers2 != undefined ? data[j].lsUsers2 : [];
					let arrUserIn3 = data[j].lsUsers3 != undefined ? data[j].lsUsers3 : [];
					
					let arrUser = group.users;
					
					for(let k in arrUser){
						for(let l in arrUserIn1A){
							
							if(arrUser[k].entity.identyId == arrUserIn1A[l].entity.identyId){
								MessageBox.show('Usuario: ' + arrUser[k].entity.identyId + 
										' ya asignado al documento interno '+data[j].docInvId+'.',
										MessageBox.Icon.ERROR, "Error");
								return;
							}
						}
					}
					
					for(let k in arrUser){
						for(let l in arrUserIn1B){
							
							if(arrUser[k].entity.identyId == arrUserIn1B[l].entity.identyId){
								MessageBox.show('Usuario: ' + arrUser[k].entity.identyId + 
										' ya asignado al documento interno '+data[j].docInvId+'.',
										MessageBox.Icon.ERROR, "Error");
								return;
							}
						}
					}
					
					for(let k in arrUser){
						for(let l in arrUserIn2){
							
							if(arrUser[k].entity.identyId == arrUserIn2[l].entity.identyId){
								MessageBox.show('Usuario: ' + arrUser[k].entity.identyId + 
										' ya asignado al documento interno '+data[j].docInvId+'.',
										MessageBox.Icon.ERROR, "Error");
								return;
							}
						}
					}
					
					for(let k in arrUser){
						for(let l in arrUserIn3){
							
							if(arrUser[k].entity.identyId == arrUserIn3[l].entity.identyId){
								MessageBox.show('Usuario: ' + arrUser[k].entity.identyId + 
										' ya asignado al documento interno '+data[j].docInvId+'.',
										MessageBox.Icon.ERROR, "Error");
								return;
							}
						}
					}
					
				}
				
				
			}
			
			/////FIN Verificar tipo/////
			this.updateRouteGroup(group.groupId);
			
		},
		
		updateRouteGroup: async function(groupId){
			
			let routeGroup;
			switch(this.flagTeam.split(" - ")[0]){
			
			case '1A':
				routeGroup = this.infoRecord.routeGroup1A;
				break;
				
			case '1B':
				routeGroup = this.infoRecord.routeGroup1B;
				break;
				
			case '2':
				routeGroup = this.infoRecord.routeGroup2;
				break;
				
			case '3':
				routeGroup = this.infoRecord.routeGroup3;
				break;
				
			case 'X':
				routeGroup = this.infoRecord.routeGroupX;
				break;
				
			}
			
			let routeGroupBean = {
				groupId : groupId,
				routeGroup :  routeGroup,
				countNum : this.flagTeam.split(" - ")[0]
			}

			const request = {
				tokenObject: null,
				lsObject:routeGroupBean
			};

			const json = await this.execService(InveServices.CHANGE_ROUTE_GROUP,request,"updateRouteGroup",this.showLog);

			if(json){
				this.updateGroupInTask(groupId);
				BusyIndicator.hide();
			}
		},
		
		updateGroupInTask: async function(groupId){
			
			let taskBean = new Object();
			let docInvId = new Object();
			
			taskBean.groupId = groupId;
			taskBean.oldGroupId = this.flagTeam.split(" - ")[1];
			docInvId.docInvId = this.infoRecord.docInvId;
			taskBean.docInvId = docInvId;

			const request = {
				tokenObject: null,
				lsObject:taskBean
			};

			const json = await this.execService(InveServices.CHANGE_GROUP_TASK,request,"updateGroupInTask",this.showLog);

			if(json){
				sap.ui.getCore().byId('vAssignTeam').getController().clearTableFilters();
				sap.ui.getCore().byId('vAssignTeam').getController().loadDocsSplit();
				
				setTimeout(function() {
					sap.ui.getCore().byId('vAssignTeam').getController().message('Se asignó el grupo '+groupId
							+' al conteo '+this.flagTeam.split(" - ")[0]+' del documento interno '+this.infoRecord.docInvId+' exitosamente.',
							sap.ui.core.MessageType.Success);
					
					setTimeout(function() {
						sap.ui.getCore().byId("vAssignTeam--messagesBox").getItems()[0].close();
					},4500);
				}.bind(this),3500);
				
				this.oDialog.close(); 
				BusyIndicator.hide();
			}
			
		},
	})
}
);