sap.ui.define(
  [
    "com/bmore/inveweb/controller/BaseController",
  ],
  function (Controller) {
    "use strict";

    return Controller.extend("com.bmore.inveweb.controller.Login", {
      onInit: function () {
        this.showLog = false;
        
        this.getView().addDelegate({
          onBeforeShow: function () {
            sap.ui.getCore().byId("container-inveweb---idAppControl").getController().loginNavbar();
            sap.ui.getCore().byId("container-inveweb---idAppControl").getController().getCheckSession();
           this.BusyIndicatorOff();
       
          }.bind(this),
        });
      },

      checkToken: async function () {
        // Check if token already exists
        if (this._getToken()) {
          try {
            await this.checkSession();
            UIComponent.getRouterFor(this).navTo("Home");
            BusyIndicator.hide();
          } catch (error) {
            this.showAlert(error, "ERROR");
          }
        }
      },
      checkForm: async function () {
        this.byId("msgsId").setVisible(false);
        this.BusyIndicatorOn();
        let user = this.byId("user").getValue();
        let pwd = this.byId("password").getValue();

        if (user.trim().length == 0 || pwd.trim().length == 0) {
          this.byId("msgsId").setText(this.getResourceBundle("emptyUsr"));
          this.byId("msgsId").setVisible(true);
          return false;
        } else {
          // Submit form
          await this._login(user, pwd);
        }
        this.BusyIndicatorOff();
      },

      _login: async function (username, password) {
        const request = {
          loginId: username,
          loginPass: password,
          loginLang: null,
          activeInterval: null,
          relationUUID: null,
          lsObjectLB: null,
        };
       let json = await this.execLogin(InveServices.LOGIN,request,"_login",this.showLog);
       if(json){
        const sessionData ={
          user : json.lsObject.lsObjectLB,
          roles : json.lsObject.roles,
          token : json.lsObject.token
        }
     
        this.setSessionDataObject(sessionData);
        sap.ui.getCore().byId("container-inveweb---idAppControl--avatar").setInitials(this.getUserInitials());
        this.navTo("Home");
       }
        
      },
      
    });
  }
);
