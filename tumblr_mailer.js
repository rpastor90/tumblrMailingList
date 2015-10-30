var fs = require('fs');
var tumblr = require('tumblr.js');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('oq5YCskHNBh5gMBDa40pMA');

var csvFile = fs.readFileSync("friend_list.csv","utf8");
var emailTemplate = fs.readFileSync("email_template.html", "utf8");

function csvParse (csvFile) {
  var output = [];
  var arr = csvFile.split('\n').join().split(',').slice(4);
  for (var i = 0; i < arr.length - 1; i += 4) {
    var object = {
      firstName : arr[i],
      lastName : arr[i+1],
      numMonthsSinceContact : arr[i+2],
      emailAddress : arr[i+3],
    };
    output.push(object);
  }
  return output;
}

var csv_data = csvParse(csvFile);
// console.log(csv_data.length);


function sevenDays () {
  var now = Date.now();
  return +now.toString().slice(0, -3) - 604800;
}

// Authenticate via OAuth
var tumblr = require('tumblr.js');
var client = tumblr.createClient({
  consumer_key: 'peNKzQRH2h77nDLUctC5kaIgE4OEyJITbRwtMNObN5ko0qvdPQ',
  consumer_secret: 'YiMXUlQn50DwgFaOAS9c5zEAezcMDeo0BhzXvao8aTImwiOGdT',
  token: '39YE761dXAdJsb7BXqvlwmzd2I57ozaYBvP752yKQ8HaPVLIzD',
  token_secret: 'F46eoxdQhkEQIAXiioJ8UTsMJNIcwzmmRzjTo0geDhYULZY26s'
});

function getPostInfo(blog) {
  var POST = blog.posts;
  var postArr = [];
  for (var i = 0; i < POST.length; i++) {
    postArr.push({title: POST[i].slug, timeStamp: POST[i].timestamp, link: POST[i].short_url});
  }
  return postArr;
}

function getLatestPosts (input) {
  var Seven = sevenDays();
  var latestPosts = [];
  for (var i = 0; i < input.length; i++) {
    if (input[i].timeStamp > Seven) {
      latestPosts.push(input[i]);
    }
  }
  return latestPosts;
}

client.posts('blogtechnical', function(err, blog){
  var postInfo = getPostInfo(blog);
  var latestPosts = getLatestPosts(postInfo);
  emailTemplate = emailTemplate.replace("{{link}}", latestPosts[0].link);
  emailTemplate = emailTemplate.replace("{{title}}", latestPosts[0].title);

  function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 }

  function redactEmails(csv_data, emailTemplate) {
    for (var key in csv_data) {
        emailTemplate = emailTemplate.replace("{{" + key + "}}", csv_data[key]);
      }
    return emailTemplate;
  }

  function personalEmails(csv_data, emailTemplate) {
    var output = [];
    for (var i = 0; i < csv_data.length; i++) {
      sendEmail(csv_data[i].firstName, 
        csv_data[i].emailAddress, 
        'Rafiel', 
        'rafiel.pastor@gmail.com', 
        'blogtechnical Mailing List', 
        redactEmails(csv_data[i], emailTemplate))
    }
  }
  var EMAILS = personalEmails(csv_data, emailTemplate);
});







