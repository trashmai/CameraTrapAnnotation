db.local_data.find({ url: { $regex: /127\.0\.0\.1/ } }).forEach(function(e) {
    var tmp_url = e.url;
    tmp_url = tmp_url.replace(/127\.0\.0\.1/, 'localhost');
    e.url = tmp_url;
    db.local_data.save(e);
});