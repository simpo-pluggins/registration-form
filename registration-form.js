var accessKey ;

class getRegistrationForm{
    constructor() {
        window.onload = function(){
                if(document.getElementById('registration-form') != null){
                let enquiryId = document.getElementById('registration-form');
                let dataId;
                if(enquiryId){
                    accessKey = enquiryId.getAttribute('accesskey');
                    dataId = enquiryId.getAttribute('data-id');
                }
                const fontFamily = window.getComputedStyle(enquiryId)['font-family'] || null;
                const encodedFontFamily = encodeURIComponent(fontFamily);
                const bId = encodeURIComponent(accessKey.split('=')[0]);
                const name = encodeURIComponent(accessKey.split('=')[1])
                if (!enquiryId) return;
                enquiryId.innerHTML += `
                <iframe id="myHtml" src="https://simpo-pluggins.github.io/registration-form/index.html?ff=${encodedFontFamily}&denv=${dataId}&bId=${bId}&name=${name}" style="width:100%;height:calc(100vh - 20px);border:none;"></iframe>
                `
            }
        }
    }
}

enquiryForm = new getRegistrationForm();
