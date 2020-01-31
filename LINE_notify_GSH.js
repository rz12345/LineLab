/* public function */
function doPost(){
  // params
  var spreadsheet_url = 'YOUR_SPREADSHEET_URL'; // Google Spreadsheet url
  var sheet_idx = 1; // Google Spreadsheet 的 sheet index, 由左至右, 第一個 sheet 從 1 開始
  var line_notify_token = 'YOUR_LINE_NOTIFY_TOKEN'; // LINE Notify Token
  
  // request
  var key = getSpreadsheetKeyBy(spreadsheet_url);
  var response = UrlFetchApp.fetch(getSpreadsheetJsonBy(key,sheet_idx),{
    'method' : 'GET',
    'contentType': 'application/json'
  })
  
  // response handle
  var rows = JSON.parse(response.getContentText()).feed.entry;
  var msgs = [];
  rows.forEach(function(row){
    var start = row['gsx$start']['$t']; // yyyy/mm/dd hh:mm
    var end = row['gsx$end']['$t']; // yyyy/mm/dd hh:mm
    var time = row['gsx$time']['$t']; // hh:mm
    var reminder = row['gsx$reminder']['$t'];  // mins
    var title = row['gsx$title']['$t']; // text
    var msg = row['gsx$msg']['$t']; // text
    if(isToDayInPeriod(start,end) && isToRemind(time,reminder)){
      msgs.push(title+'\n'+msg);
    }
  })
  
  // send message
  if(msgs.length > 0){    
    sendMsg('\n'+msgs.join('\n'),line_notify_token);
  }
}

/* private function */
// 檢查當前時間是否介於 start 與 end 之間
// return  boolean
function isToDayInPeriod(start,end){
  var currentDate = new Date();
  var d1 = start.split(' ')[0].split('/');
  var t1 = start.split(' ')[1].split(':');
  var d2 = end.split(' ')[0].split('/');
  var t2 = end.split(' ')[1].split(':');
  var from = new Date(d1[0], parseInt(d1[1])-1, d1[2],t1[0],t1[1]);
  var to   = new Date(d2[0], parseInt(d2[1])-1, d2[2],t2[0],t2[1]);
  return (currentDate > from && currentDate < to );
}

// 檢查是否要 remind
// return boolean
function isToRemind(time,reminder){
  var d1 = new Date();
  var h = d1.getHours();
  var m = d1.getMinutes();
  var t = time.split(':');
  return h == t[0] && (m == t[1] || m == parseInt(t[1]) + parseInt(reminder));
}

// 傳入 msg 與 token, 讓 LINE notify 發訊息
function sendMsg(msg,token){
      UrlFetchApp.fetch('https://notify-api.line.me/api/notify', {
          'headers': {
              'Authorization': 'Bearer ' + token,
          },
          'method': 'post',
          'payload': {
              'message':msg
          }
      });
}

// 取得 spreadsheet json url
// return string
function getSpreadsheetJsonBy(key,idx){
  var url = 'https://spreadsheets.google.com/feeds/list/'+key+'/'+idx+'/public/values?alt=json'
  return url;
}

// 取得 spreadsheet key
// return string
function getSpreadsheetKeyBy(url){
  var re = /^(https:\/\/docs\.google\.com\/spreadsheets\/d\/)(.{44})(\/edit\#gid=)(\d+)$/;
  var result = url.match(re);
  
  try {
    return result[2];
  }
  catch (e) {
    Logger.log(e);
  }
}