const https = require('https');

const url = 'https://uepuzyvdfyylztyecpug.supabase.co/rest/v1/';
const options = {
  headers: {
    'apikey': 'sb_publishable__UaVFmqPrT2UVq_brpCeUQ_p4r63kcz',
    'Authorization': 'Bearer sb_publishable__UaVFmqPrT2UVq_brpCeUQ_p4r63kcz'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
