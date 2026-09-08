const https = require('https');

const url = 'https://uepuzyvdfyylztyecpug.supabase.co/rest/v1/inventory?select=id,name,category,item_subtype';
const options = {
  headers: {
    'apikey': 'sb_publishable__UaVFmqPrT2UVq_brpCeUQ_p4r63kcz',
    'Authorization': 'Bearer sb_publishable__UaVFmqPrT2UVq_brpCeUQ_p4r63kcz'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const items = JSON.parse(data);
      console.log('Total items:', items.length);
      if (items.length > 0) {
        console.log('Sample item:', items[0]);
        const categories = [...new Set(items.map(i => i.category))];
        console.log('Distinct categories:', categories);
      } else {
        console.log(data); // might be an error message
      }
    } catch(e) {
      console.log('Parse error:', e, data);
    }
  });
}).on('error', err => console.log(err));
