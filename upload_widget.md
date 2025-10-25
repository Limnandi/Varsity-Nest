# Upload widget


Cloudinary's Upload widget is a complete, interactive user interface that enables your users to upload files from a variety of sources to your website or application. The widget, requiring just a couple lines of code to integrate, eliminates the need to develop in-house interactive media upload capabilities.

This guide describes the latest [version](upload_widget_changelog) of the Cloudinary Upload widget.

> **NOTE**:
>
> The Cloudinary Upload widget, when configured with an accessible color theme, is designed to provide an inclusive asset sharing experience that meets **WCAG 2.1 AA** compliance. The Web Content Accessibility Guidelines (WCAG) are an internationally recognized set of recommendations for making web content more accessible to people with disabilities. These guidelines ensure that users with visual, auditory, motor, and cognitive impairments can fully engage with digital content through assistive technologies, keyboard navigation, and other accessibility-friendly enhancements. For more information, see [Accessibility](#accessibility).

> **INFO**: Cloudinary supports only the documented configuration and the supplied files with the widget. Any direct changes to the widget code and its elements (for example, CSS and JS files) might break its functionality, and will not be supported.

![Upload widget main screen](https://cloudinary-res.cloudinary.com/image/upload/q_auto/f_auto/bo_1px_solid_grey/docs/upload_widget_dev_default_new.png "width: 600, with_code:false, with_url:false, popup:true")

The Upload widget responsively resizes to fit in the available width, with the display functionality automatically adjusting on the fly for use in mobile applications.

![Upload widget main screen](https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/bo_1px_solid_grey/v1740563725/docs/upload_widget_responsive.png "width: 400, with_code:false, with_url:false, popup:true")
 

The widget offers uploading from a variety of [sources](#the_sources_parameter), such as: your local device, a remote URL, the device camera, image search, popular social media accounts and a variety of stock photography sites. The widget supports drag & drop functionality, interactive cropping, upload progress indication, and thumbnail previews. The widget also monitors and handles uploading errors and offers extensive event handling for integrating your own code.

You can implement the widget for [unsigned uploading](#unsigned_uploads) directly from the browser to Cloudinary storage, without involving your servers in the process. The widget sends JavaScript callbacks on successful uploads, so you can integrate the upload process back into your existing media pipeline. You can additionally configure Cloudinary to send server-side callbacks. Advanced users can also use the Upload widget with [signed uploads](#signed_uploads) for a more secure process when required.
   
Once uploaded, images and videos can be resized, cropped and transformed by Cloudinary on the fly so they can be embedded as needed in your website or mobile app.
  
The Upload widget requires only pure JavaScript to integrate and is easy to use within any web development framework.

## Quick example

To use Cloudinary's Upload widget in your site with unsigned uploads, include the widget's remote JavaScript file and then specify the following (minimum) information when calling the `createUploadWidget` method to initialize the widget: 

* Your product environment *cloud name* 
* The *upload preset* to use for uploading files

Once initialized, the widget is ready to be rendered when needed. The following sample includes code for binding to the `click` event of a button element in a web page, in order to call the widget's `open` method and display the initialized widget:
        ```js
<button id="upload_widget" class="cloudinary-button">Upload files</button>

<script src="https://upload-widget.cloudinary.com/latest/global/all.js" type="text/javascript"></script>  
                
<script type="text/javascript">  
var myWidget = cloudinary.createUploadWidget({
  cloudName: 'my_cloud_name', 
  uploadPreset: 'my_preset'}, (error, result) => { 
    if (!error && result && result.event === "success") { 
      console.log('Done! Here is the image info: ', result.info); 
    }
  }
)

document.getElementById("upload_widget").addEventListener("click", function(){
    myWidget.open();
  }, false);
</script> 
```
You can try out this simple Upload widget example by clicking the button below:

Upload files

The following buttons were implemented with a few additional parameters to demonstrate additional capabilities. 

  Crop and upload
  Upload and display thumbnails

These and many additional options are described on the rest of this page.

> **TIP**: Take a look at the [profile picture sample project](profile_picture_sample_project), which demonstrates the use of the Upload widget in a Next.js app.

## Code explorers

### Code explorer: Basic Upload widget

Check out the following [Upload widget code explorer](https://stackblitz.com/edit/github-vt6fzc-wms1nc) that you can fork to try out some sample configuration changes:

> **NOTE**: Due to CORS issues with StackBlitz, you may have errors opening the widget with the preview. Try opening the preview in a new tab to resolve this or use the GitHub link below to run locally.

This code is also available in [GitHub](https://github.com/cloudinary-devs/cloudinary-upload-widget-js).

> **Try this code explorer in other frameworks:**:
>
> * [React Upload widget sandbox](https://stackblitz.com/edit/cloudinary-upload-widget-react) (also uses the [React SDK](react_integration) for displaying the uploaded image)

> * [Angular Upload widget sandbox](https://codesandbox.io/s/upload-widget-angular-hp2rmc)

> * [Vue Upload widget sandbox](https://codesandbox.io/s/upload-widget-vue-hmezny)
> **TIP**: Enjoy interactive learning? Check out more [code explorers](code_explorers)!
For implementation instructions, see [Unsigned uploads](#signed-uploads).

### Sample project: Signed uploads using the Upload widget

This Node.js app demonstrates how to perform a signed upload using the Upload widget. 
The widget is constructed in [signed-uploads/public/js/uploadclientwidget.js](https://github.com/cloudinary-devs/cld-signed-upload-examples/blob/main/signed-uploads/public/js/uploadclientwidget.js) and the signature is generated in [signed-uploads/modules/signuploadwidget.js](https://github.com/cloudinary-devs/cld-signed-upload-examples/blob/main/signed-uploads/modules/signuploadwidget.js), using the `api_sign_request` method.

> **TIP**: :title=Go to the code

See [signed-uploads/public/js/uploadclientwidget.js](https://github.com/cloudinary-devs/cld-signed-upload-examples/blob/main/signed-uploads/public/js/uploadclientwidget.js) in the [cloudinary-devs/cld-signed-upload-examples](https://github.com/cloudinary-devs/cld-signed-upload-examples) GitHub repo.

#### Setup instructions (after cloning from GitHub)

1. Install all dependencies from the top level:
   
    ```Terminal
    npm install
    ```
1. Open **signed-uploads/public/js/config.js**
1. Set `cloud_name`, `api_key` and `api_secret` with the corresponding account details from the [API Keys](https://console.cloudinary.com/app/settings/api-keys) page of the Console Settings.
1. Run the app to start the server:
    
      ```Terminal
      node signed-uploads/app.js
      ```

      The response should be:

      ```Terminal
      Server is up on http://localhost:3000
      ```
1. Open `http://localhost:3000` in a browser.

Go to [GitHub](https://github.com/cloudinary-devs/cld-signed-upload-examples) to try it out:

  
  
  
 

For implementation instructions, see [Signed uploads](#signed_uploads).

## Cloudinary Upload widget video tutorial

This video demonstrates how to integrate a basic Upload widget using a code sandbox.

  This video is brought to you by Cloudinary's video player - embed your own!Use the controls to set the playback speed, navigate to chapters of interest and select subtitles in your preferred language.

### Tutorial contents This tutorial presents the following topics. Click a timestamp to jump to that part of the video.
### Create an upload preset
{table:class=tutorial-bullets}|  | 
| --- | --- |
|{videotime:id=media :min=0 :sec=29 :player=cld} | In the Upload page of the Console Settings, create a new, unsigned upload preset. This preset serves as a form of security override, allowing client-side unsigned uploads. You supply the preset name in your widget creation call.|

### Create a code sandbox
{table:class=tutorial-bullets}|  | 
| --- | --- |
|{videotime:id=media :min=0 :sec=59 :player=cld} | Create a basic empty code sandbox project to implement the widget. |

### Include the JavaScript file
{table:class=tutorial-bullets}|  | 
| --- | --- |
|{videotime:id=media :min=1 :sec=08 :player=cld} | Include the cloudinary widget JavaScript file (`https://upload-widget.cloudinary.com/latest/global/all.js`) in your web page.|

### Add the widget
{table:class=tutorial-bullets}|  | 
| --- | --- |
|{videotime:id=media :min=1 :sec=16 :player=cld} | Use the `createUploadWidget` method to create your widget, specifying the upload preset that you created in the first step, your cloud name, and some additional widget options.|

### Add a button
{table:class=tutorial-bullets}|  | 
| --- | --- |
|{videotime:id=media :min=1 :sec=43 :player=cld} | Add an HTML button to the page to display the widget when clicked.|

### Add an event listener
{table:class=tutorial-bullets}|  | 
| --- | --- |
|{videotime:id=media :min=2 :sec=02 :player=cld} |  Add an event listener to open the widget when the button is clicked.|

### Run the project
{table:class=tutorial-bullets}|  | 
| --- | --- |
|{videotime:id=media :min=2 :sec=12 :player=cld} |  Run the project and upload a file. |

### See the response in the console
{table:class=tutorial-bullets}|  | 
| --- | --- |
|{videotime:id=media :min=2 :sec=22 :player=cld} |  See the response to the upload logged to the console. |

### Additional information
{table:class=tutorial-bullets}|  | 
| --- | --- |
|{videotime:id=media :min=2 :sec=33 :player=cld} |  You can find out more in the [Upload Widget documentation](upload_widget).|

## How to set up and integrate the Upload widget

For most needs, you can set up the Upload widget for `unsigned` uploads. Using unsigned uploads with your widget makes it quick and simple for you to provide a UI where users can upload content to your site. 

Signed uploads require a bit more setup and coding, but provide a more secure upload process when required. 

> **TIP**: You can use the [Cloudinary CLI](cloudinary_cli#make) to generate the basic code for an Upload widget: 

```
cld make upload_widget
```

### Unsigned uploads

Unsigned uploads are somewhat less secure than signed uploads. For example, it is possible for a customer to inspect your client-side HTML code to find your cloud name and preset, and use that information to upload unwanted files to your Cloudinary product environment. For this reason, unsigned uploads have some [protective limitations](image_upload_api_reference#unsigned_upload_parameters). For example, existing assets can't be overwritten. The options you set in the unsigned preset can also limit the size or type of files that users can upload to your Cloudinary product environment using that preset.

**To setup and add an Upload widget for unsigned uploads:**
#### 1. Include the cloudinary widget JavaScript file in your web page:
You can choose between always importing the `latest` version of the Upload Widget or importing a specific version. 

All the latest Upload Widget functionality is included in the `https://upload-widget.cloudinary.com/latest/global/all.js` JavaScript file. 

To include a specific version of the Upload widget, replace `latest` with the version number you want to include.

For example:

```html
<script src="https://upload-widget.cloudinary.com/latest/global/all.js" type="text/javascript">  
</script> 

... **OR** to include a specific version (e.g., `2.26.12`):

<script src="https://upload-widget.cloudinary.com/2.26.12/global/all.js" type="text/javascript">  
</script> 
``` 

> **INFO**:
>
> * We generally recommend including the `latest` version to ensure that your users always get the latest fixes and functionality.  However, if you want to maintain more control over the pace of updates, you can test and use a specific version. In this case, we recommend that you watch the [Upload widget changelog](product_gallery_changelog) (or register for the [Upload widget changelog RSS feed](https://cloudinary.com/documentation/rss/cloudinary-uw-changelog.xml)) and regularly test and upgrade to the latest versions. 

> * When using both the [Upload Widget](upload_widget) and [Video Player](cloudinary_video_player) on the same page, the video player scripts must be loaded first to prevent any conflicts.

#### 2. Optional. Set your cloud name globally

If you include multiple widgets in your web page, you can use the [setCloudName](upload_widget_reference#cloudinary_setcloudname_name) method to instruct all widgets on the page to upload to the same Cloudinary product environment. Alternatively, you can set the product environment `cloud_name` as a parameter of each widget creation call.

#### 3. Create an unsigned upload preset 

In the **Upload** section of the Console Settings, create a new, unsigned upload preset. This preset serves as a form of security override, allowing client-side unsigned uploads. You supply the preset name in your widget creation call. Alternatively, you can [create an unsigned upload preset using the Admin API](admin_api#create_an_upload_preset).You can optionally edit the preset to modify its name or apply any of the available upload options, such as applying incoming transformations to control the size or type of asset users can upload using your widget, or to automatically generate certain eager transformations on all uploaded assets. For details, see [Upload presets](upload_presets).
   
#### 4. Add your widget 

Use one of the [widget initialization methods](upload_widget_reference#initialization_methods) to create your widget. When you call the method, you specify the `uploadPreset` that you created in the previous step, your `cloudName` (if you did not set it [globally](upload_widget_reference#setcloudname)), and any additional [widget options](upload_widget_reference#parameters) you want to apply.For example, in the [demo example](#crop_and_folder) earlier on this page, the [createUploadWidget](upload_widget_reference#createuploadwidget) method call includes the `cropping` option, which enables users to define cropping coordinates, and the `folder` option, which uploads all images from the widget to a specified folder:
    
```js
var myCropWidget = cloudinary.createUploadWidget({
  cloudName: 'demo', uploadPreset: 'preset1', folder: 'widgetUpload', cropping: true}, 
  (error, result) => { console.log(error, result) })
````

### Signed uploads

Instead of providing an upload preset name, you initialize the widget for signed uploads with the public API key and an upload signature that is generated either when the page is loaded or when the upload request is submitted.

> **See also:**:
>
> [Sample project: Signed uploads using the Upload widget](#sample_project_signed_uploads_using_the_upload_widget)

**To setup and implement the Upload widget for signed uploads:**
#### 1. Include the cloudinary widget JavaScript file in your web page:
You can choose between always importing the `latest` version of the Upload Widget or importing a specific version. 

All the latest Upload Widget functionality is included in the `https://upload-widget.cloudinary.com/latest/global/all.js` JavaScript file. 

To include a specific version of the Upload widget, replace `latest` with the version number you want to include.

For example:

```html
<script src="https://upload-widget.cloudinary.com/latest/global/all.js" type="text/javascript">  
</script> 

... **OR** to include a specific version (e.g., `2.26.12`):

<script src="https://upload-widget.cloudinary.com/2.26.12/global/all.js" type="text/javascript">  
</script> 
``` 

> **INFO**:
>
> * We generally recommend including the `latest` version to ensure that your users always get the latest fixes and functionality.  <br/><br/>However, if you want to maintain more control over the pace of updates, you can test and use a specific version. In this case, we recommend that you watch the [Upload widget changelog](product_gallery_changelog) (or register for the [Upload widget changelog RSS feed](https://cloudinary.com/documentation/rss/cloudinary-uw-changelog.xml)) and regularly test and upgrade to the latest versions. 

> * When using both the [Upload Widget](upload_widget) and [Video Player](cloudinary_video_player) on the same page, the video player scripts must be loaded first to prevent any conflicts.

#### 2. Optional. Set your cloud name globally

If you include multiple widgets in your web page, you can use the [setCloudName](upload_widget_reference#cloudinary_setcloudname_name) method to instruct all widgets on the page to upload to the same Cloudinary product environment. Alternatively, you can set the product environment `cloud_name` as a parameter of each widget creation call.

#### 3. Optional. Create a signed upload preset 

When you use the Upload widget for signed uploads, an upload preset isn't mandatory. But you can optionally create a signed preset if you want to define incoming or eager transformations on the uploaded asset. Define the signed upload preset as described in [Upload presets](upload_presets) and supply the preset name in the `uploadPreset` option when you call the widget creation method.
    
#### 4. Select string or function as the upload_signature type and prepare the required code
 
* **String**: 

    * Requires your page to connect to the web server on page load to generate the signature. 
    * Requires that all parameters required for signing are known at page load time. If user input will affect the parameters, for example, if you are using the widget's interactive cropping option, then you must use the function option.
    * The signature is valid for one hour from the timestamp used in the signature. If a user keeps the page open for a long time, the signature string may expire. 
    * The signature string you provide must be generated from all parameters used, including 'source=uw'. 'source=uw' is a hidden parameter sent automatically by the Upload widget, but must still be included in the string to sign. For example, a string to sign might be: `public_id=dog&source=uw&timestamp=155307631&upload_preset=myPreset`.

        > **NOTE**: The parameters in the string to sign need to be serialized in alphabetical order and require **snake_case**, which is in contrast to the camelCase used for the widget parameters. For details on generating the signature string, see [Generating authentication signatures](authentication_signatures).
* **Function**: 

    * Requires you to create a function to generate the signature. 
    * The function runs when the upload request is submitted, therefore, the timestamp does not risk expiring if the user keeps the page open.
    * The function receives the final parameters of the upload, including any parameters impacted by user interaction.
    
        **Sample function**:<br/>The following is an example of a function that uses a server-side endpoint to generate the signature.

          ```js
          <script type="text/javascript">
            var generateSignature = function(callback, params_to_sign){
              $.ajax({
               url     : "https://www.my-domain.com/my_generate_signature",
               type    : "GET",
               dataType: "text",
               data    : { data: params_to_sign},
               complete: function() {console.log("complete")},
               success : function(signature, textStatus, xhr) { callback(signature); },
               error   : function(xhr, status, error) { console.log(xhr, status, error); }
              });
            }
          </script>
          ```

> **INFO**: You must use the timestamp value provided by the widget (passed in `params_to_sign`) and not create your own timestamp value.  

#### 5. Add your widget 

Use one of the [widget initialization methods](upload_widget_reference#initialization_methods) to create your widget. When you call the method, you specify your `api_key`, your `cloudName` (if you did not set it [globally](upload_widget_reference#setcloudname)), the `uploadSignature` string or function, the `uploadSignatureTimestamp` (for string signatures only), and any additional [widget options](upload_widget_reference#parameters) you want to apply.<br/>For example, the [applyUploadWidget](upload_widget_reference#applyUploadWidget) method creates the Upload widget and calls the signature function shown in the previous step:
    
```js
cloudinary.applyUploadWidget(document.getElementById('upload_widget_opener'), 
  { api_key : "my_api_key", cloudName: "demo", uploadSignature: generateSignature }, 
  (error, result) => { }); 
```

<a class="anchor" name="example_signed_uploads_using_the_upload_widget"></a>

## Third-party upload sources

In addition to the 'My Files', 'Web Address', and 'Camera' sources, the Upload widget supports a variety of third&#x2011;party upload sources from which your users can upload images and videos. The sources are presented on multiple tabs (web) or options (mobile/responsive) for your users, so they can  select the relevant source, browse through their files and select the ones they want to upload. When the number of sources exceeds the available widget width, carousel scrolling arrows are added. 

![Upload widget sources](https://res.cloudinary.com/demo/image/upload/c_scale,w_500/bo_1px_solid_gray/dpr_2.0/f_auto/q_auto/docs/widgets/uw_sources.png "width: 500, with_code:false, with_url:false, popup:true")
<br/>
The number of sources that can be displayed without scrolling depends on the length of the label values of the selected sources. With the default label texts, 7-8 sources can be displayed at once. However, if you [customize or translate the labels](#localization), the scrolling arrows may be displayed with more or fewer sources.

At responsive widths narrower than 768px, the widget switches to the mobile display with a collapsible side menu. 

![Upload widget main screen](https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/bo_1px_solid_grey/v1740563725/docs/upload_widget_responsive.png "width: 400, with_code:false, with_url:false, popup:true")

### The sources parameter

The `sources` parameter accepts an array of string values defining the source options to add to the Upload widget, where each source defines a new upload tab or source option within the widget. The `sources` parameter can be included in the method used for creating the Upload widget, and is only specified when you want to limit the available sources (all sources are added by default if this parameter is omitted). The possible values for the `sources` parameter are as follows:

Value | Description
---|---
local| Upload a file from your local device. Adds the `My Files` source option.
url| Upload a file from a remote location. Adds the `Web Address` source option.
camera| Upload an image file via the device's camera. Adds the `Camera` source option. <p/>**Note**: Desktop/laptop only - a mobile device's camera is accessed through the `local` (My Files) source option.
dropbox| Upload a file from your Dropbox account. Adds the [Dropbox](#dropbox_source) source option.
image_search| Upload a file from the web using Google's Search Engine. Adds the [Image Search](#image_search_source) source option.
shutterstock| Upload an image from a Shutterstock account. Adds the [Shutterstock](#shutterstock_source) source option.
gettyimages| Upload an image from a Getty Images account. Adds the [gettyimages](#gettyimages) source option.
istock| Upload an image from an iStock account. Adds the [iStock](#istock_source) source option.
unsplash | Upload an image from Unsplash.  Adds the [Unsplash](#unsplash_source) source option.
google_drive | Upload a file from a Google Drive account. Adds the [Google Drive](#google_drive_source) source option.

The sources are displayed in the same order that you add them to the `sources` parameter.

> **NOTE**: Beginning July 1, 2023, the Upload widget no longer supports Instagram or Facebook as third-party upload sources. If those sources are requested, they will no longer work.

### Image Search source

The `image_search` option allows your users to select images from the web using your Google **Custom Search account**, and then upload them to Cloudinary. The search can be optionally confined to specific sites (e.g., your own website) and can be filtered by specified licensing criteria.

![Image Search option](https://cloudinary-res.cloudinary.com/image/upload/q_auto/f_auto/bo_1px_solid_grey/docs/upload_widget_image_search_new.png "width: 500, popup:true")

> **INFO**: To enable this search option, you must obtain an API Key from Google. The API Key is free to use within certain search rate limits, and there are various large scale commercial options as well. To enable Google Custom Search and generate your API Key see [https://developers.google.com/custom-search/json-api/v1/overview](https://developers.google.com/custom-search/json-api/v1/overview).

To enable the `image_search` option, add the following parameters to the method you use for creating the Upload widget:

* `sources` (Array of strings) - Optional. If you add this parameter to limit the available options, make sure to include the `image_search` option. 
* `searchBySites` (Array of Strings) - Optional. The domain names of sites you want to allow for the search. If more than one site is specified then a **Search by Site** drop-down will be added, so your users can select the site to search. To allow searching the entire web, use the value `all`. Default value: `all`
* `searchByRights` (Boolean) - Optional. Set to `true` to add a drop-down box so that users can select a licensing filter to apply to the image search. Default value: `false`.

Additionally, you must provide:

* `googleApiKey` (String) - The API key for your Google Custom Search account.

Basic example:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  sources: [ 'local', 'url', 'image_search'],
  googleApiKey: 'AIrFcR8hKiRo' }, (error, result) => { });
```

Example with sites filter and rights filter:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  sources: [ 'local', 'url', 'image_search'],
  googleApiKey: 'AIrFcR8hKiRo',
  searchBySites: ["all", "cloudinary.com"],
  searchByRights: true }, (error, result) => { });
```

![Image Search select](https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/bo_1px_solid_grey/docs/upload_widget_image_search_bags_new.png "width: 500, popup:true")

### Dropbox source

The `dropbox` option allows your users to login to their own Dropbox account, browse through their folders and files, and then select the files to upload to Cloudinary. This option requires that the Upload widget is embedded in a secure (HTTPS) page because the user sign-in to Dropbox must be over a secure connection.

To enable this upload option for your users, you must obtain an **App key from Dropbox**:

1. Create a new app on the [Dropbox App Console](https://www.dropbox.com/developers): Click **My apps**, select the **Dropbox API** and **Full Dropbox** options, name your app, and click the **Create app** button.
2. On the next page, set the following **redirect URI** for your Dropbox application: `https://widget.cloudinary.com/v2.0/global/auth/index.html`
3. Copy the auto-generated **App key** for your Dropbox app: this will be configured as the value of the `dropboxAppKey` parameter when including Dropbox as an upload source in the Upload widget (see below).
4. Your Dropbox app is initially created in Development status for testing purposes. You can enable additional users with the **Enable additional users** button, and when your app is ready to go live, you need to click on the **Apply for Production** status to enable all your users to upload via the Dropbox app.
5. For more information on creating Dropbox apps, see their [documentation](https://www.dropbox.com/developers/reference/developer-guide) and take note of their [branding guidelines](https://www.dropbox.com/developers/reference/branding-guide?oref=e).

<div style="clear: both; margin-bottom: 20px">
</div>
<div style="text-align:center;">

<span style="display:inline-block;vertical-align:top;">
<a href="https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/v1740567491/docs/upload_widget_dropbox_new.png" target ="_blank"><img src="https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/bo_1px_solid_grey/docs/upload_widget_dropbox_new.png" height=350 alt=Dropbox source" title="Dropbox source" style="margin-right: 10px;display:block;" /></a>
</span>

<span style="display:inline-block;vertical-align:top;">
<a href="https://res.cloudinary.com/demo/image/upload/bo_1px_solid_gray/h_280,dpr_2/docs/dropbox_login.png" target ="_blank"><img src="https://res.cloudinary.com/demo/image/upload/bo_1px_solid_gray/h_280,dpr_2/docs/dropbox_login.png" height=350 alt="SUBTITLE_2" title="SUBTITLE_2" style="margin-right: 10px;display:block;" /></a>

</span>

</div>
<div style="clear: both; margin-bottom: 20px">
</div>

To enable the `Dropbox` source, add the following parameters to the method you use for creating the Upload widget:

* `sources` (Array of strings) - Optional. If you add this parameter to limit the available options, make sure to include the `dropbox` option. 
* `dropboxAppKey` (String) - The App key to your Dropbox App.

For example:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  sources: [ 'local', 'url', 'dropbox'],
  dropboxAppKey: '1dsf42dl1i2' },  (error, result) => { });
```

   
### Shutterstock source

The `shutterstock` option allows your users to log in to their own Shutterstock account, browse the assets and then select the ones to upload to Cloudinary. If they haven't yet purchased the Shutterstock asset they select, they can purchase it as part of this process.
   

![Shutterstock login](https://cloudinary-res.cloudinary.com/image/upload/q_auto/f_auto/bo_1px_solid_grey/docs/upload_widget_shutterstock_new.png "width: 500, popup:true")

To enable the Shutterstock source, add the following parameter to the method you use for creating the Upload widget:

* `sources` (Array of strings) - Optional. If you add this parameter to limit the available options, make sure to include the `shutterstock` option. 

For example:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  sources: [ 'local', 'url', 'shutterstock']}, (error, result) => { });
```

### Getty Images source

The `gettyimages` option allows your users to log in to their own Getty Images account, browse the assets and then select the ones to upload to Cloudinary. If they have not yet purchased the asset they select, they can purchase it as part of this process.
   

![gettyimages login](https://cloudinary-res.cloudinary.com/image/upload/bo_1px_solid_gray/dpr_auto/docs/upload_widget_gettyimages_new.png "width: 500, popup:true")

To enable the Getty Images source, add the following parameter to the method you use for creating the Upload widget:

* `sources` (Array of strings) - Optional. If you add this parameter to limit the available options, make sure to include the `gettyimages` option. 

For example:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  sources: [ 'local', 'url', 'gettyimages']}, (error, result) => { });
```

### iStock source

The `istock` option allows your users to log in to their own iStock account, browse the assets and then select the ones to upload to Cloudinary. If they haven't yet purchased the iStock asset they select, they can purchase it as part of this process.
   

![iStock login](https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/bo_1px_solid_grey/upload_widget_istock_new.png "width: 500, popup:true")

To enable the iStock source, add the following parameter to the method you use for creating the Upload widget:

* `sources` (Array of strings) - Optional. If you add this parameter to limit the available options, make sure to include the `istock` option. 

For example:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  sources: [ 'local', 'url', 'istock']}, (error, result) => { });
```

### Unsplash source

The `unsplash` option allows your users to browse the assets on Unsplash, and then select the ones to upload to your Cloudinary account.
   

![Unsplash login](https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/bo_1px_solid_grey/docs/upload_widget_unsplash_new.png "width: 500, popup:true")

To enable the Unsplash source, add the following parameter to the method you use for creating the Upload widget:

* `sources` (Array of strings) - Optional. If you add this parameter to limit the available options, make sure to include the `unsplash` option. 

For example:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  sources: [ 'local', 'url', 'unsplash']}, (error, result) => { });
```

> **NOTE**: Some of the Unsplash filters are available only after conducting a textual search.

### Google Drive source

The `google_drive` option allows your users to login to their own Google Drive account, browse through their files and then select the files to upload to Cloudinary. 
   
![Google Drive source](https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/bo_1px_solid_grey/docs/upload_widget_googledrive_new.png "width: 500, popup:true")

To enable the Google Drive source, add the following parameters to the method you use for creating the Upload widget:

* `sources` (Array of strings) - Optional. If you add this parameter to limit the available options, make sure to include the `google_drive` option. 
* `googleDriveClientId` (String) - Optional. The Client ID of your own Google Drive application for accessing your users' Google Drive accounts. If not provided, uses the Cloudinary Google Drive app.

For example:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  sources: [ 'local', 'url', 'google_drive'],
  googleDriveClientId: '1wsds35jrt34dsssw21' }, (error, result) => { });
```

> **NOTE**: The Google Drive source is not supported by either Internet Explorer 11 or by Safari browsers.

## API events

The Upload widget methods include a callback function for implementing event handling. The callback has the following signature: `function(error, result)`, where `error` is either `null` if successful or an error message if there was a failure, while `result` is a JSON object detailing the triggered event.

For example, to log a message to the console when a user clicks the 'show completed' button:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  showCompletedButton: true,  
  }, (error, result) => {
       if (!error && result.event === "show-completed") {
     result.info.items.forEach((item) => {
       console.log(`show completed for item with id:
      ${item.uploadInfo.public_id}`); //uploadInfo is the data returned in the upload response
    });
  }
});
```

For a full listing of available events, see the [Events](upload_widget_reference#events) section in the Upload widget API reference.

## Pre-batch validation

If you need to run any validation on the files in the upload queue before they are uploaded to Cloudinary, you can set the `preBatch` parameter with a function to run beforehand. If the code in your function determines that the upload should be canceled, you can include the `cancel` boolean parameter set to `true` when calling the callback function.

For example, to cancel the upload if the file name is 'TopSecret':

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  preBatch: (cb, data) => {
    if (data.files[0].name === "TopSecret") {
      cb({cancel: true}); 
    }
    else { 
      cb(); 
    }
  }, (error, result) => { }); 
```

## Prepare upload parameters

If you need to do any preparation on the files in the upload queue before they are uploaded to Cloudinary, you can set the `prepareUploadParams` parameter with a function to run beforehand. Use this function to prepare any upload parameters you might need, such as to specify tags or metadata for each file, or even prepare an upload signature for a signed upload, as in the following example:

```js
cloudinary.openUploadWidget({
  upload_preset: "preset1",
  cloud_name: "demo",
  prepareUploadParams: (cb, params) => {
    params = [].concat(params);  //params can be a single object or an array of objects
    Promise.all(params.map((req) =>
      makeAjaxRequest("https://mysite.example.com/prepare", req)
        .then((response) => Object.assign({
          signature: response.signature,
          apiKey: response.api_key,
        }, response.upload_params))
    ))
      .then((results) =>
        cb(results.length === 1 ? results[0] : results));
  }
}, (error, result) => { }); 
```

> **NOTES**:
>
> * The prepareUploadParams callback only supports preparing the following parameters:  `apiKey`, `auditContext`, `context`, `folder`, `invalidate`, `metadata`, `overwrite`, `publicId`, `qualityAnalysis`, `resourceType`, `signature`, `tags`, `uniqueFilename`, `uploadPreset` `uploadSignatureTimestamp`, `useFilename`.

> * If the `prepareUploadParmas` parameter is included then the `uploadSignature` parameter is ignored. If you also need to provide a signature, make sure to include that code in your `prepareUploadParams` function and pass the signature as part of the data passed to the callback (cb).

> * If the code in your function determines that the upload should be canceled, you can include the `cancel` boolean parameter set to `true` when calling the callback function (the same way you can cancel the upload with [Pre-batch validation](#pre_batch_validation)).

## Tagging suggestions

You can add tagging suggestions that appear while your users are typing in the **Add a Tag** (Advanced options) text field, by providing a function that is called whenever the text changes in the field. Your function should call the callback function with the list of tagging suggestions to display. Add the `getTags` parameter with the function to call, and make sure to also set the `showAdvancedOptions` parameter to `true`.

The following example demonstrates a mini auto-complete function that returns only suggestions matching the current text entered in the field:

```js
const tags = ["extract", "amazing", "apple", "dog", "grass", "planes", "rocket", "rock", "movies", 
  "music", "sad", "light", "open", "mosaic", "entertainment", "test", "testament", "beach", 
  "vacation", "weather", "letter", "orchard"];
const getMyTags = (cb, prefix) => cb(prefix ? tags.filter((t) => !t.indexOf(prefix)) : tags);

cloudinary.openUploadWidget({
  cloudName: "demo", 
  uploadPreset: "preset1",
  showAdvancedOptions: true,        
  getTags: getMyTags, //provide callback to retrieve tagging suggestions
  }, (error, result) => { }); 
```

Here's the Upload widget with tagging enabled:

![Upload widget - tagging](https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/bo_1px_solid_grey/docs/upload_widget_tags_new.png "width: 600, with_code:false, with_url:false, popup:true")

## Upload preset selection

You can offer your users an additional *Advanced option* with a selection of [Upload Presets](upload_presets) to choose from, by providing a function that is called to provide the list of presets to offer. Your function should call the callback function with the list of tagging suggestions to display. Add the `getUploadPresets` parameter with the function to call, and make sure to also set the `showAdvancedOptions` parameter to `true`.

The following example demonstrates a upload preset selection function that returns 3 presets:

```js
const presets = ["signed", "video", "eager"];
const getMyUploadPresets = (cb) => cb(presets);

cloudinary.openUploadWidget({
  cloudName: "demo", 
  uploadPreset: "preset1",   // default preset
  showAdvancedOptions: true,
  getUploadPresets: getMyUploadPresets
  },  (error, result) => { });
```

Here's the Upload widget with upload preset selection enabled:

![Upload widget - upload preset selection](https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/bo_1px_solid_grey/v1740569522/docs/upload_widget_upload_preset.png "width: 600, with_code:false, with_url:false, popup:true")

## Look and feel customization

The look & feel of the Upload widget can be fully customized. You can modify the colors, fonts, and other elements by providing your own customization. 

Custom styling is specified using the `styles` parameter, which accepts a JSON structure defining the default elements to override. Styles are further divided as follows:

* *palette* for defining the colors of the various elements as an RGB or RGBA hex triplet or quadruplet, or a 3- or 4-digit RGB/RGBA hex.
* *fonts* for defining the font to use for all the text elements. Currently the widget only supports fonts from Google (available via `fonts.googleapis.com`).

The following example sets all elements to their default values (for reference purposes) - in practice you only need to include the elements you want to override:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  styles:{
    palette: {
      window: "#FFF",
      windowBorder: "#90A0B3",
      tabIcon: "#0E2F5A",
      menuIcons: "#5A616A",
      textDark: "#000000",
      textLight: "#FFFFFF",
      link:  "#0078FF",
      action:  "#FF620C",
      inactiveTabIcon: "#0E2F5A",
      error: "#F44235",
      inProgress: "#0078FF",
      complete: "#20B832",
      sourceBg: "#E4EBF1"
    },
    frame: {
      background: "#0E2F5B99"
    }
    fonts: {
        "'Cute Font', cursive": "https://fonts.googleapis.com/css?family=Cute+Font",
    }
  }, (error, result) => { }); 
```

> **TIP**:
>
> Use the [Upload widget Demo page](https://demo.cloudinary.com/uw/) to visualize the Upload widget customization options. You can select the pre-defined **Accessible** theme that meets **WCAG 2.1 AA** compliance, or choose any colors you like. When you're happy with the colors you selected, **Copy** the palette customization code to the clipboard.

## Accessibility

Web accessibility ensures that your website is inclusive for all visitors, including those with disabilities. The Web Content Accessibility Guidelines **(WCAG) 2.1 AA**
provide an internationally recognized standard for making digital content accessible.

The Cloudinary Upload widget is designed to meet these accessibility requirements. It includes built-in support for keyboard navigation, screen readers, and low-vision use cases (requires configuration), all without requiring changes to your core workflows.

![Accessible Upload widget](https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/bo_1px_solid_grey/v1756988429/docs/upload_widget_accessible.png "width: 600, with_code:false, with_url:false, popup:true")

> **NOTE**: Cloudinary offers additional tools and best practices to help make the media on your website or app more accessible. For guidance on captions, alt text, and other accessibility features, see our [Accessibility guide](accessible_media).

### Motor and mobility support

For users who rely on a keyboard instead of a mouse, the Upload widget is fully navigable:

* Reach images and items in scrollable regions using Tab and Shift+Tab, following a logical and predictable focus order.

* When panels open (e.g., filter results), focus automatically moves to the first control in the panel and remains inside until the panel closes, preventing loss of context.

### Support for screen readers

For users with sight disabilities, it's critical that assistive technologies are able to interpreted the interface accurately. The Upload widget provides semantic markup, accessible names, and other features to support this:

* All form controls have programmatically associated labels.

* Actionable elements, such as buttons and links, expose clear, descriptive names.

* Informative images include alternative text, while decorative images are marked to be ignored.

* Lists use semantic containers (``, ``), and landmarks are uniquely named to make navigation more efficient with screen readers.

* Filter results display in a live region so that screen reader users are aware of changes without needing to move focus.

### Support for low vision and color blindness

To improve readability and perception for users with low vision or color-vision deficiencies:

* **Zoom and scaling**: Users can enlarge text and interface elements as needed, ensuring they can comfortably read and interact with the widget.

* **Color and contrast**: You can configure an accessible color theme with sufficient contrast by:
  * Defining your own palette, or
  * Using the [Upload widget Demo page](https://demo.cloudinary.com/uw/) to select the predefined **Accessible** theme and copy the palette customization code.

**Example: Upload widget configuration with the Accessible theme applied**

```js
cloudinary.openUploadWidget({
  cloudName: "<cloud name>",
  uploadPreset: "<upload preset>",
  styles: {
    palette: {
      window: "#FFFFFF",
      windowBorder: "#6A7481",
      tabIcon: "#3448C5",
      menuIcons: "#5A616A",
      textDark: "#000000",
      textLight: "#FFFFFF",
      link: "#3448C5",
      action: "#3448C5",
      inactiveTabIcon: "#0E2F5A",
      error: "#F44235",
      inProgress: "#3448C5",
      complete: "#20B832",
      sourceBg: "#F5FAFE"
    },
    fonts: {
      default: null,
      "'Fira Sans', sans-serif": {
        url: "https://fonts.googleapis.com/css?family=Fira+Sans",
        active: true
      }
    }
  }
}, (err, info) => {
  if (!err) {
    console.log("Upload widget event - ", info);
  }
});
```

## Localization

The text used in the Upload widget can be fully customized for different languages. The translations for each language are specified using the `text` parameter, which accepts a JSON structure defining the value to use for each text element in each language. The `language` parameter sets which of the language options to use from those defined in the text parameter (`en` by default). To override any of the default values, you only need to include the elements you want to override.

All the default values can be found at: [https://widget.cloudinary.com/v2.0/global/text.json](https://widget.cloudinary.com/v2.0/global/text.json). 

For example, to only customize the queue `title`, queue `title_uploading_with_counter`, and the crop `title`:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  language: "en",  
  text: {
    "en": {
        "queue": {
            "title": "Files to upload",
            "title_uploading_with_counter": "Uploading {{num}} files"
        },
        "crop": {
            "title": "Crop your image"

        }
    }
  }
}, (error, result) => { });
```

> **NOTE**: Elements that support a variable value (specified inside double braces `{{...}}`) are replaced with the actual value at runtime. Only the elements that already contain the double braces in the [default localization file](https://widget.cloudinary.com/v2.0/global/text.json) support variables.

## Encryption

Files can be encrypted and then uploaded to Cloudinary as `raw` files. These files cannot be previewed within Cloudinary and will need to be decrypted after downloading them. To add this feature to the Upload widget, add the `encryption` parameter and include an encryption key and initialization vector (`key` and `iv`). 

To encrypt the file, the widget uses the browser's AES-GCM `TextEncoder` encryption with the [SubtleCrypto library](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm_2).

For example:

```js
cloudinary.openUploadWidget({
  cloudName: "demo", uploadPreset: "preset1",
  encryption: {
    key: "ff234fe526725753fa45b53325", 
    iv: "cd8a46d72e26a365dca78ef"
  }
}, (error, result) => { });
```

### Decryption

Files that are uploaded and encrypted by the widget can be decrypted using the AES-GCM [SubtleCrypto library](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt#aes-gcm). The library offers methods for decrypting a file using the encryption key and initialization vector provided when uploading the file (the same encryption  `key` and `iv` configured for the widget).

The `decrypt` method accepts the `key`, `iv`, and a `buffer` - the file in base64 format: 

```js
subtleCrypto.decrypt(
  {
    name: "AES-GCM",
    iv: iv
  },
  key,
  buffer
);
```

For example, using the `decrypt` method that passes the "dog.jpg" file in base64 format, a key of "ff234fe526725753fa45b53325", and an iv of "cd8a46d72e26a365dca78ef": 

```js
const response = await fetch('https://res.cloudinary.com/demo/image/upload/shirt.jpg');
const buffer = await response.arrayBuffer();
let decryptedFile = await subtleCrypto.decrypt(
  {
    name: "AES-GCM",
    iv: "cd8a46d72e26a365dca78ef"
  },
  'ff234fe526725753fa45b53325', 
  buffer
);
```

## Notifying server side code

If you are implementing the widget and also need to process that information in your server side code, the best solution is to include a [notification URL](notifications) in the `uploadPreset` parameter for the widget. You can then parse the response you get from the widget upload.

In the following Python example, the widget response is used to store the image model:

```python
from flask import Flask, request, abort
from cloudinary.utils import verify_notification_signature
from yourapp.models import Photo

app = Flask(__name__)

@app.route("/upload/notify", methods=["POST"])
def upload_notify():
    raw_body = request.data.decode("utf-8")
    timestamp = request.headers.get("X-Cld-Timestamp")
    signature = request.headers.get("X-Cld-Signature")
    if not all([timestamp, signature]):
        abort(400, "Missing required headers")
    if not verify_notification_signature(raw_body, timestamp, signature, valid_for=300):
        abort(403, "Invalid or expired signature")
    json_data = request.get_json()

    # Here goes your post-processing code
    asset_info = {
        "public_id": json_data.get("public_id"),
        "resource_type": json_data.get("resource_type"),
        "secure_url": json_data.get("secure_url"),
    }

    # You can log it
    print("Cloudinary Upload Notification:", asset_info)
    
    # Or save to your DB model
    photo = Photo(title="Uploaded Image", image=asset_info["secure_url"])
    photo.save()
    return {"status": "OK"}, 200
```

## Upload widget reference

For details on all the available methods, parameters and events, see the [Upload widget reference](upload_widget_reference).

### Accessible navigation

The Upload widget enables keyboard accessibility, attending to users who only use a keyboard (unable to use a mouse) or are visually impaired and use a keyboard and a screen reader. Upload widget end users can use the following keyboard actions as set by accessibility standards:

* **Tab** and **Shift+Tab** to navigate forwards and backwards between the sources tabs, and **Enter** to select.
* On the 'My Files' source tab:
* **Tab** to the 'Select Files' button, and **Enter** to select.
* Keyboard search and navigation in the dialog that opens for selecting a file (as supported by the operating system).
* On the preview screen, **Tab** between Upload, Reset, Back and Close, and **Enter** to select (keyboard crop is currently not supported).

                

