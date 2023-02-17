sap.ui.define([
	"com/bmore/inveweb/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
  "sap/m/MessageStrip",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterType",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/MessageType",
  "sap/ui/core/util/Export",
  "sap/ui/core/util/ExportTypeCSV",
], function(Controller,MessageBox,BusyIndicator,JSONModel,Fragment,MessageStrip,Filter,FilterType,FilterOperator,MessageType,Export,ExportTypeCSV) {
  'use strict';

  return Controller.extend("com.bmore.inveweb.controller.vCategory", {
    onInit: function() {
            
      this.getView().addDelegate({
          
        onBeforeShow: function(evt) {  
          this.cleanView();    
          this.backupRecord = {};
          this.loadCategory();
          this.showLog=false;
          BusyIndicator.hide();
            }.bind(this)
        });
    },

     cleanView: function(){
    
      this.byId("bNew").setEnabled(true);
      this.byId("bEdit").setEnabled(false);
      this.byId("bCancel").setEnabled(false);
      this.byId("bSave").setEnabled(false);
      this.byId("bDelete").setEnabled(false);	
      this.byId("bTemplate").setEnabled(true);	
      this.byId("bUpload").setEnabled(true);	
      this.byId("bMatrn").setEnabled(false);		
      this.byId("fSearch").setValue("");
      
      // Empty table
      let oModel = new JSONModel([]);
      
      let oTable = this.byId("oTable");
      oTable.setModel(oModel,"oModel");
            
    },

    loadCategory: async function(){
      const request = {
        tokenObject: null,
        lsObject: ""
      };

      const json = await this.execService(InveServices.GET_CATEGORIES,request,"loadCategory",this.showLog);

      if(json){
        
        let oModel = new JSONModel(json.lsObject);
                                    
        let oTable = this.byId("oTable");
        oTable.setModel(oModel,"oModel");
        BusyIndicator.hide();
      }
    },

    updateTable: function(oEvent){
      this.byId("bNew").setEnabled(true);
      this.byId("bEdit").setEnabled(true);
      this.byId("bCancel").setEnabled(false);
      this.byId("bSave").setEnabled(false);
      this.byId("bDelete").setEnabled(true);	
      this.byId("bTemplate").setEnabled(true);	
      this.byId("bUpload").setEnabled(true);	
      this.byId("bMatrn").setEnabled(true);
      this.selectedItemCells = oEvent.getSource().getSelectedItem().getCells();
    },

    editRecord: function(oEvent){
		
		this.byId("bNew").setEnabled(true);
    this.byId("bEdit").setEnabled(true);
    this.byId("bCancel").setEnabled(true);
    this.byId("bSave").setEnabled(true);
    this.byId("bDelete").setEnabled(true);	
    this.byId("bTemplate").setEnabled(true);	
    this.byId("bUpload").setEnabled(true);	
    this.byId("bMatrn").setEnabled(true);
		this.selectedItemCells[1].setEnabled(true);
		
	}, 

     deleteRecord: function(){
				MessageBox.confirm("¿Desea eliminar el material?", {
				actions: ["Si", "No"],
				onClose: function (sAction) {
					if(sAction === "Si"){
                    
                    //Empty backup record
                    this.backupRecord = {};
                    //Delete data
                    let arrToDelete = "";
                    let arr = [];
                    let oTable = this.getView().byId("oTable");
                    let selectedItems = oTable.getSelectedItems();
                    let data = oTable.getModel("oModel").getData();
                                      
                    for(let i = 0; i < data.length; i++){
                      if(selectedItems.indexOf(oTable.getItems()[i]) == -1 ){
                        arr.push(data[i]);
                      }else{
                        arrToDelete = data[i].catId;
                      }			    			        			
                    }			        			
                    
                    this.deleteAction(arrToDelete, arr);
                    
                    
                  }  			        	  			        	  
                }.bind(this)						
          }
        );

    }, 

    deleteAction: async function(arrToDelete, arr){
      const request = {
        tokenObject: null,
        lsObject: arrToDelete
      };

      const json = await this.execService(InveServices.DELETE_CATEGORIES,request,"deleteCategories",this.showLog);

      if(json){
       this.byId("oTable").removeSelections(true);
       this.loadCategory();
        this.byId("bNew").setEnabled(true);
       this.byId("bEdit").setEnabled(false);
       this.byId("bCancel").setEnabled(false);
       this.byId("bSave").setEnabled(false);
       this.byId("bDelete").setEnabled(false);	
       this.byId("bTemplate").setEnabled(true);	
       this.byId("bUpload").setEnabled(true);	
       this.byId("bMatrn").setEnabled(false);
        
          let oModel = new JSONModel(arr);
                    
          let oTable = this.byId("oTable");
          oTable.setModel(oModel,"oModel");
          
            
        MessageBox.warning("Se eliminó de forma exitosa."); 
        BusyIndicator.hide();	
      }      
      
    },

    cancelEdition: function(){
				let row = this.byId("oTable").getSelectedItems();
				MessageBox.confirm("¿Desea cancelar la edición?", {
				actions: ["Si", "No"],
				onClose: function (sAction) {
					if(sAction === "Si"){
						row[0].getCells()[1].setEnabled(false);
						this.byId("oTable").removeSelections(true);
						this.loadCategory();
						this.byId("bNew").setEnabled(true);
            this.byId("bEdit").setEnabled(false);
            this.byId("bCancel").setEnabled(false);
            this.byId("bSave").setEnabled(false);
            this.byId("bDelete").setEnabled(false);	
            this.byId("bTemplate").setEnabled(true);	
            this.byId("bUpload").setEnabled(true);	
            this.byId("bMatrn").setEnabled(false);
								}

				}.bind(this)
			});
    },

     downloadTemplate: function(){
      
        let link = document.createElement("a");
        link.href = InveTemplates.CAT_BY_MAT;
        link.click();	
    },

    openFilePicker: function(){
      
      $('#fileCatMatnr').click();		
    },

      uploadTemplate: function(){
      let that = this;
      this.eraseNotification();
          
        let file = $('#fileCatMatnr').prop('files')[0];
        let allowedFiles=['csv'];
        let ext = file.name.split('.').pop().toLowerCase();
        let arrTosend = [];
      
      // Check if is an allowed file
      if(allowedFiles.indexOf(ext) == -1){
        this.toast("Tipo de archivo no permitido, " +
            "solo se permiten archivos de tipo: " +  allowedFiles, '20em');
        $('#fileCatMatnr').val("");
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
            let modelData = that.byId("oTable").getModel("oModel").getData();
            
            if(allTextLines[size - 1].indexOf(",") == -1){
              allTextLines.splice(-1);
            }	        

        
          BusyIndicator.show();
                  
         for (let i = 1; i < allTextLines.length; i++) {
  
              data = allTextLines[i].split(',');
              
              if(data.length < 2){
            
            that.toast("Datos faltantes para la entrada: " + i, '20em');
            return;
          }
              
              if(isNaN(data[1])){
                
                BusyIndicator.hide();
                let message = 'Dato no válido para "Categoría Id" en la linea: ' + (i + 1); 
                that.message(message,MessageType.Error);
                
                return;
              }	        		        	
                          
              let found = false;
             
              
              for(let j in modelData){
                
                if(modelData[j].catId == data[1]){	        			
                  found = true;
                  break;
                }
              }
              
              if(!found){
              
                BusyIndicator.hide();
                
                let message = '"Categoría Id" no válido en la linea: ' + (i + 1); 
                that.message(message, MessageType.Error);
                
                return;
              }
              
              let object = new Object();
              object.matnr = data[0];	        	
              object.catId = data[1];
              
              arrTosend.push(object);
                          
            }
        
          that.uploadMatnrByCat(arrTosend);			
        }
        
        function errorHandler(evt) {
  
          if(evt.target.error.name == "NotReadableError") {	        			
            MessageBox.show('No se puede leer el archivo.',					
              MessageBox.Icon.ERROR, "Error");
          }
  
        }		
        
      $('#fileCatMatnr').val("");
    },

    filterTable: function(){
    
          let fSearch = this.byId("fSearch");
          let value = fSearch.getValue();
          let oFilterCategory = new Filter("category", FilterOperator.Contains, value);
          let allFilter = new Filter([oFilterCategory]);        
          let oTable = this.byId("oTable");
          oTable.getBinding("items").filter(allFilter, FilterType.Application);
    },

      loadRelatedMatnr:async function(){
        let enable = this.byId("oTable").getSelectedItems();
        let catId = enable[0].getCells()[0].getText();
        this.catId = catId;
        let category = enable[0].getCells()[1].getValue();
        this.category = category;

        let oView = this.getView();
        if (!this.byId("oDialogCategory")) {

            Fragment.load({
                id: oView.getId(),
                name: "com.bmore.inveweb.view.fragments.vMCCategory",
                controller: this
              }).then(async function(oDialog){
                oView.addDependent(oDialog);	
               oDialog.setTitle("Categoría"+" "+catId+" " +category);
               this.tableFrgModelCat = new JSONModel([]);
               this.backupRecord = {}; 
               await this.matnrCat(catId, category);
                oDialog.open();
              }.bind(this));
        }else{
              this.byId("oDialogCategory").setTitle("Categoría"+" "+catId+" " +category);
              this.tableFrgModelCat = new JSONModel([]);
               this.backupRecord = {}; 
               await this.matnrCat(catId, category);
              this.byId("oDialogCategory").open();
        }

    },
    matnrCat: async function(catId, category){
      const request = {
        tokenObject: null,
        lsObject: catId
      };

      let json = await this.execService(InveServices.GET_MATNR_CAT_ID_MAKTX,request,"matnrCat",this.showLog);

      if(json){
        
        for(let i in json.lsObject){
              
          json.lsObject[i].matnr = String(json.lsObject[i].matnr);
          json.lsObject[i].matkx = String(json.lsObject[i].matkx);
        }
        
        let oModel = new JSONModel(json.lsObject);    
        let oTable = this.frgById("oTableCategory");
        oTable.setModel(oModel,"oModel");

        //Create a model and bind the table rows to this model	   
        BusyIndicator.hide();	         		
        return json.lsObject; 
      }
     
      this.frgById("oTableCategory").setModel(this.tableFrgModelCat, "oModel");
      this.frgById("lbCat").setText(category); 

    },
    tableSecond: function(){
      this.frgById("bDeleteMatrn").setEnabled(true);
      let oTable = this.frgById("oTableCategory");
      let selectedItems = oTable.getSelectedItems();

      if(selectedItems.length >0 ){
        this.frgById("bDeleteMatrn").setEnabled(true);
      }
      if(selectedItems.length == 0){
        this.frgById("bDeleteMatrn").setEnabled(false);
            }
     },
     downloadMatrn: async function(){
      const request = {
          tokenObject: null,
          lsObject: this.catId
        };
  
      let json = await this.execService(InveServices.GET_MATNR_CAT_ID_MAKTX,request,"matnrCat",this.showLog);
  
        if(json){
          
          for(let i in json.lsObject){
                
            json.lsObject[i].matnr = String(json.lsObject[i].matnr);
            json.lsObject[i].matkx = String(json.lsObject[i].matkx);
          }
        }
          
      let data = new JSONModel(json.lsObject);
      let oExport;
      let columnas;
  
       columnas = [
                      {name: "Materiales",template: {content: "{matnr}"}}
                      ,{name: "Descripción",template: {content: "{matkx}"}}
  
       ]
  
      oExport = new Export({
  
                  exportType: new ExportTypeCSV({
                      fileExtension: "csv",
                      separatorChar: this.getCharSeparator()
                  }),
  
                  models: data,
  
                  rows: {
                      path: "/"
                  },
                  
                  columns: columnas
              });
  
                oExport.saveFile("Lista de materiales "+this.catId+" - "+this.category)
                .then(function() {
                  oExport.destroy();  
                })
                .catch(function(oError){
                  console.error("Error al exportar csv", oError);
                }); 
          },
          filterSearch: function(eve){

            let value = eve.getSource().getValue();
            let oFilterCatMatnr = new Filter({
              filters: [
              new Filter("matnr", FilterOperator.Contains, value),
              new Filter("matkx", FilterOperator.Contains, value)
              ],
              and: false
            });
           
            let oBinding = this.frgById("oTableCategory");
            oBinding.getBinding("items").filter(oFilterCatMatnr, FilterType.Application);
                
           },
    cleanOdialog: function(){
		
      let fSearch = this.frgById("fSearch");
      fSearch.setValue("");	
      let mat = this.frgById("matnr");
      mat.setValue("");
    },
    eraseNotificationFragment : function() {
      this.frgById("vbFrame").setVisible(false);		
    },
    messageFragment: function(message, type){
      
      
      let mTrip = new MessageStrip({			
        text : message, 
        type : type, 
        showIcon : true, 
        showCloseButton : true, 
        close: function(){
          this.eraseNotificationFragment();	
        }.bind(this)			
      });
            
        let messagesBox = this.frgById("messagesBoxFragment");
          messagesBox.removeAllItems();
          messagesBox.addItem(mTrip);
        
          this.frgById("vbFrame").setVisible(true);	
          

    },
    uploadMatnrByCatFragment: async function(){
      let arrTosend = [];
      let matnr = this.frgById("matnr").getValue();
      if(matnr.length == 0){
       
       let message = 'Es necesario introducir un Id para el Material.'; 
       this.messageFragment(message, MessageType.Error);
       
         return;
     }
      let object = new Object();
             object.matnr = matnr;	        	
             object.catId = this.catId;;
             
             arrTosend.push(object);
     //this.validateMa(matnr,this.catId);
     const request = {
       tokenObject: null,
       lsObject: arrTosend
     };

     const json = await this.execService(InveServices.ADD_CATEGORY,request,"uploadMatnrByCatFragment",this.showLog);

     if(json.abstractResult.intCom1 == 1){
       MessageBox.show(json.abstractResult.resultMsgAbs,
       MessageBox.Icon.ERROR, "Material duplicado");
     }
     else{
       MessageBox.success("El proceso de carga se realizó de forma exitosa.");
       this.matnrCat(this.catId,this.category);
     }


       BusyIndicator.hide();	
       this.cleanOdialog();
     
    
   },
   deleteRecordFragment: function(){

    let messagesBox = this.frgById("messagesBoxFragment");
      messagesBox.removeAllItems();		
         
    MessageBox.confirm(
         "¿Desea eliminar los materiales seleccionados?", {
                icon: MessageBox.Icon.QUESTION,
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function(oAction) { 
                if(oAction == 'YES'){
                  
                  //Empty backup record
                  this.backupRecord = {};
                  //Delete data
                  let idMaterial = "";
                  let arr = [];
                  let oTable = this.frgById("oTableCategory");
                  let selectedItems = oTable.getSelectedItems();
                  let data = oTable.getModel("oModel").getData();
                                    
                  for(let i = 0; i < data.length; i++){
                    if(selectedItems.indexOf(oTable.getItems()[i]) == -1 ){
                      arr.push(data[i]);
                    }else{
                      idMaterial = data[i].matnr + "";
                      this.deleteActionFragment(idMaterial, arr);
                    }			    			        			
                  }			        			
                  
                  
                  
                }  			        	  			        	  
              }.bind(this)						
        }
      );

  }, 
  deleteActionFragment: async function(idMaterial, arr){
    const request = {
      tokenObject: null,
      lsObject: idMaterial
    };
    const json = await this.execService(InveServices.DELETE_MATNR,request,"deleteMatnr",this.showLog);

    if(json){
      let oModel = new JSONModel(arr);
                           
      let oTable = this.frgById("oTableCategory");
      oTable.setModel(oModel,"oModel");
      
        
    let message = 'Materiales eliminados de forma exitosa.'; 
    this.messageFragment(message, MessageType.Success); 
    
    setTimeout(function() {
      this.frgById("messagesBoxFragment").getItems()[0].close(); 
    }.bind(this),3000);  
    BusyIndicator.hide();	 
    }

    this.cleanOdialog();
    
  },
    _closeDialog:function(){
      this.byId("oDialogCategory").close();
    },
    frgById:function(id){
        return Fragment.byId(this.getView().getId(), id);
    },

    newRecord: function(){
			let oView = this.getView();
                if (!this.byId("saveRecordCategory")) {
                    Fragment.load({
					id: oView.getId(),
                        name: "com.bmore.inveweb.view.fragments.vMCCCategory",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });

                } else {
          this.byId("saveRecordCategory").open();
					this.byId("newValue").setValue();
                }
		},

    	saveNewRecord: async function(){
			this.byId("newValue").setValueState("None");

			let categoria = this.byId("newValue").getValue();
			categoria = categoria.trim();
		
			
			if(categoria.length == 0){
				MessageBox.warning('El campo no puede estar vacio');
				return;

			}
			else{
				let opciones = this.byId("oTable").getItems();
						
                for(let i in opciones){
                    
                    if(categoria == opciones[i].getCells()[1].getValue()){
                        
                        MessageBox.warning('"Categoria" ya registrada.');
                        
                        return;
                    }	            			
                }
			}
			if(categoria.length == 0){
				MessageBox.warning('Es necesario introducir el "Valor".');
				return;

			}

			
			let data = {
				category: categoria,	
			};

			let request = new Object();
            request.tokenObject = null;
            request.lsObject = data;
			
			try{
            await this.execService(InveServices.SAVE_CATEGORY,request,"saveCategory",this.showLog);
            }catch(error){
				console.log(error);
			}
			this.byId("saveRecordCategory").close()
			MessageBox.success("Se guardó el registro de forma exitosa.");

			this.byId("oTable").removeSelections(true);
			this.loadCategory();
			this.byId("bNew").setEnabled(true);
			this.byId("bEdit").setEnabled(false);
			this.byId("bCancel").setEnabled(false);
			this.byId("bSave").setEnabled(false);
			this.byId("bDelete").setEnabled(false);
		},

    eraseNotification : function() {
      this.byId("vbFrame").setVisible(false);		
    },

    cancelNewRecord: function(){
      this.byId("saveRecordCategory").close();

    },

    uploadMatnrByCat: async function(arrTosend){
      const request = {
        tokenObject: null,
        lsObject: arrTosend
      };

      

      const json = await this.execService(InveServices.ADD_CATEGORY,request,"uploadMatnrByCat",true);

      if(json){
        let message = 'El proceso de carga se realizó de forma exitosa.'; 
        this.message(message, MessageType.Success); 
        
        setTimeout(function() {
          this.byId("messagesBox").getItems()[0].close();  
        }.bind(this),3000); 
        BusyIndicator.hide();	
      }
      
    },

    saveEdition: async function(){
      let opciones = this.byId("oTable").getSelectedItems();
      let  value = opciones[0].getCells()[1].getValue()
      value = value.trim();
      
      
          if(value.length == 0){

            let message = 'Es necesario introducir la "Categoría".'; 
            this.message(message, MessageType.Error);
            
              return;
          }

      let category = new Object();
      category.catId =  opciones[0].getCells()[0].getText() > 0 ? opciones[0].getCells()[0].getText(): 0;
      category.category = opciones[0].getCells()[1].getValue();

      const request = {
        tokenObject: null,
        lsObject: category
      };

      let json = await this.execService(InveServices.SAVE_CATEGORY,request,"saveCategory",this.showLog);
      if(json){
        this.selectedItemCells[1].setEnabled(false);
        this.message("Categoria guardada exitosamente","Success");
      }
     

    },

    message: function(message, type){
      
      
      let mTrip = new MessageStrip({			
        text : message, 
        type : type, 
        showIcon : true, 
        showCloseButton : true, 
        close: function(){
          this.eraseNotification();	
        }.bind(this)			
      });
            
        let messagesBox = this.byId("messagesBox");
          messagesBox.removeAllItems();
          messagesBox.addItem(mTrip);
        
        this.byId("vbFrame").setVisible(true);	
              
        setTimeout(function() {
          let scrtollTo = this.byId("messagesBox");
          this.byId("pCategory").scrollToElement(scrtollTo);
				}.bind(this),50);

    },

	});
});  