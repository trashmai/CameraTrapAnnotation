// var app = angular.module('annImg', ['ngMaterial', 'angularTreeview']);
var app = angular.module('annImg', ['angularTreeview']);
app.controller('annImgController', ['$scope', '$sce', 'simpleQueryService', function($scope, $sce, simpleQueryService) {

    window.annScope = $scope;
    window.imageLock = 0;

    $scope.subscriptions = [];
    // $scope.toggledMenuClass = {};

    $scope.target_image_class = {
        image: true,
        fit: true,
        full: false,
        orig: false
    };

    $scope.search = false;

    $scope.setCurrentImage = function() {
        localStorage.setItem('cii', $scope.current_image_idx);
        window.location.reload();
    }


    $scope.setThreshold = function() {
        localStorage.setItem('threshold', $scope.threshold);
        alert("成功設定 threshold 為" + $scope.threshold);
        window.location.reload();
    }

    if (!localStorage.getItem('threshold')) {
        $scope.threshold = 300;
        $scope.setThreshold();
    } else {
        $scope.threshold = parseInt(localStorage.getItem('threshold'));
    }

    $scope.found = {};
    $scope.showSelectionBox = {};
    $scope.autoRes = {};
    $scope.elmSearchStyle = { 'background-color': 'black', 'color': 'floralwhite' };
    $scope.elmSearchStyleInd = {};

    $scope.in_serial = false;


    $scope.isfullscreen = false;


    $scope.standard_data_key = ['category-zhtw', 'name-scientific', 'name-vernacular-zhtw', 'sex', 'life-stage', 'verbatim-behavior-zhtw', 'idv-char'];
    $scope.standard_data = [
        { label: '類別', key: 'category-zhtw', value: '', unit: '' },
        { label: '學名', key: 'name-scientific', value: '', unit: '' },
        { label: '中名', key: 'name-vernacular-zhtw', value: '', unit: '' },
        { label: '性別', key: 'sex', value: '', unit: '' },
        { label: '年齡', key: 'life-stage', value: '', unit: '' },
        { label: '行為', key: 'verbatim-behavior-zhtw', value: '', unit: '' },
        { label: '個體', key: 'idv-char', value: '', unit: '' }
    ];

    $scope.current_image_timestamp = -1;
    $scope.last_image_timestamp = -1;
    $scope.current_image_dir_idx = -1;
    $scope.last_image_dir_idx = -1;

    $scope.toggleSib = function(e) {

        e.preventDefault();
        e.stopPropagation();
        var t = $(e.target).next();

        var toggled_class = 'must_show';
        // var toggled_class = 'enlong';

        //*
        if (!t.hasClass(toggled_class)) {
            $(e.target).addClass('mm-expand');
            $(e.target).removeClass('mm-close');
            t.addClass(toggled_class);
            t.removeClass('must_hide');
        } else if (t.hasClass(toggled_class)) {
            $(e.target).addClass('mm-close');
            $(e.target).removeClass('mm-expand');
            //t.css('display', 'none');
            t.removeClass(toggled_class);
            t.addClass('must_hide');
        }
        //*/
    }

    $scope.toggleTargetImageClass = function(e) {
        $scope.target_image_class.drag_target = true;

        if (!!$scope.target_image_class.fit) {
            $scope.target_image_class.fit = false;
            $scope.target_image_class.full = true;
            $scope.target_image_class.orig = false;
        } else if (!!$scope.target_image_class.full) {
            $scope.target_image_class.fit = true;
            $scope.target_image_class.full = false;
            $scope.target_image_class.orig = false;
            //$('img.drag_target').draggable();
        }
        return $scope.target_image_class;
    }

    $scope.toggle_magnifier = function() {
        if (!window.is_magged) {
            window.$mag = $('#target_image').magnify({
                speed: 10,
                src: $scope.ann.url,
            });
            window.is_magged = true;
        } else {
            window.is_magged = false;
            $mag.destroy();
        }
    }

    $scope.elmSearchME = function(idx) {
        $scope.elmSearchStyleInd[idx] = { 'background-color': 'blue', 'color': 'floralwhite' };
    }

    $scope.elmSearchML = function(idx) {
        $scope.elmSearchStyleInd[idx] = { 'background-color': 'black', 'color': 'floralwhite' };
    }


    $scope.current_query_id = 0;

    $scope.color_names = [
        'navy', 'blue', 'aqua', 'teal', 'olive', 'green', 'lime', 'yellow',
        'orange', 'fuchsia', 'purple', 'maroon', 'gray', 'silver', 'black'
    ];

    var tmp_image_list = localStorage.getItem('image_list');
    if (!!tmp_image_list) {
        $scope.image_list = JSON.parse(tmp_image_list);
    } else {
        $scope.image_list = [];
    }

    $scope.image_url = null;

    var cii = localStorage.getItem('cii');

    if (!!cii) {
        $scope.current_image_idx = parseInt(cii);
    } else {
        $scope.current_image_idx = 0;
    }

    $scope.resetImageList = function(reload) {

        if (reload === undefined) reload = true;

        localStorage.removeItem('image_list');
        localStorage.removeItem('ibs');
        localStorage.removeItem('dbs');
        localStorage.removeItem('dibs');

        $scope.current_image_idx = $scope.idx_before_search;
        $scope.idx_before_search = undefined;

        $scope.currentDir = $scope.dir_before_search;
        $scope.dir_before_search = undefined;

        $scope.currentDirIdx = $scope.dir_idx_before_search;
        $scope.dir_idx_before_search = undefined;

        $scope.search = false;
        if (reload) {
            $scope.setCurrentImage($scope.current_image_idx);
        }
    }

    var ibs = localStorage.getItem('ibs');
    if (!!ibs) {
        $scope.idx_before_search = parseInt(localStorage.getItem('ibs'));
        $scope.dir_before_search = localStorage.getItem('dbs');
        $scope.dir_idx_before_search = parseInt(localStorage.getItem('dibs'));
        $scope.resetImageList(reload = false);
    }

    $scope.auto_copy_all_tokens = false;
    $scope.auto_copy_all_tokens_override = false;
    $scope.force_auto_copy = false;

    var _dir_stats = function(image_list) {
        $scope.dir = {};
        $scope.dir_idx = ['dummy_for_avoiding_zero'];
        var prev_dir_idx = -1;

        image_list.forEach(function(img, idx) {
            if ($scope.dir_idx.indexOf(img.dir_path) < 0) {
                $scope.dir_idx.push(img.dir_path);
            }
        });

        image_list.forEach(function(img, idx) {

            var img_dir_idx = $scope.dir_idx.indexOf(img.dir_path);

            if (!$scope.dir[img_dir_idx]) {
                $scope.dir[img_dir_idx] = {};
            }

            if (prev_dir_idx != img_dir_idx) {
                prev_dir_idx = img_dir_idx;
                $scope.dir[img_dir_idx].start = idx;
            }
            $scope.dir[img_dir_idx].end = idx;
            $scope.dir[img_dir_idx].counts = $scope.dir[img_dir_idx].end - $scope.dir[img_dir_idx].start + 1;
        });
    }


    var _getImageList = function(image_list_file, _callback) {
        // display demo contents
        simpleQueryService.simpleQuery(image_list_file, {})
            .then(function(ret) {
                if (ret.length >= 0) {
                    $scope.image_list = ret;
                    localStorage.setItem('image_list', angular.toJson($scope.image_list));
                }

                localStorage.setItem('cd', $scope.currentDir);
                localStorage.setItem('cdi', $scope.currentDirIdx);

                _dir_stats($scope.image_list);

                //_selectImage($scope.current_image_idx);

                if (typeof _callback == 'function') {
                    _callback($scope.image_list);
                }

            })
    }

    var getBurstTerminalIdx = function(offset) {
        var offset = offset;
        var cii = $scope.current_image_idx;
        var cit = $scope.current_image_timestamp;
        var nii = cii + offset;
        if (!!$scope.image_list[nii])
            var nit = $scope.image_list[nii].timestamp;
        while (Math.abs(nit - cit) <= $scope.threshold && nii < $scope.image_list.length && nii >= $scope.dir[$scope.current_image_dir_idx].start && nii <= $scope.dir[$scope.current_image_dir_idx].end) {
            cii = nii;
            cit = nit;
            nii = cii + offset;
            if (!!$scope.image_list[nii])
                nit = $scope.image_list[nii].timestamp;
        }
        return nii - offset;
    }

    $scope.gotoPercentile = function(p) {
        if (!$scope.in_serial) return;
        var burst_start = getBurstTerminalIdx(-1);
        var burst_end = getBurstTerminalIdx(1);
        var q = burst_start + Math.round((burst_end - burst_start) * p);


        if (_leaveAndSave()) {
            $scope.saveAnnotation();
        }

        $scope.current_image_idx = q;
        // $scope.setCurrentImage();
        _selectImage(q);

    }

    $scope.gotoTerminalOfBurst = function(offset) {
        if (!$scope.in_serial) return;

        var nii = getBurstTerminalIdx(offset);

        if (_leaveAndSave()) {
            $scope.saveAnnotation();
        }

        $scope.current_image_idx = nii;
        // $scope.setCurrentImage();
        _selectImage(nii);
    }

    $scope.selectImage = function() {
        if (_leaveAndSave()) {
            $scope.saveAnnotation();
        }
        var dir_stats = $scope.dir[$scope.dir_idx.indexOf($scope.image_list[0].dir_path)];
        if ($scope.goto_image_idx >= dir_stats.start && $scope.goto_image_idx <= dir_stats.end) {
            $scope.current_image_idx = $scope.goto_image_idx;
            _selectImage($scope.current_image_idx);
        }
    }

    var _selectImage = function(idx, search) {

        if (search === undefined) search = false;

        if (!$scope.image_list[idx]) {
            // reset
            idx = 0;
        }

        if (!search) {
            localStorage.setItem('cii', idx);
        }
        $scope[$scope.treeModel].some(function(dirNode) {
            if ($scope.currentDir == dirNode.id && dirNode.children.length > 0) {
                var treeId = $scope.treeId;
                var selectedNode = dirNode.children[$scope.current_image_idx];
                //remove highlight from previous node
                if ($scope[treeId].currentNode && $scope[treeId].currentNode.selected) {
                    $scope[treeId].currentNode.selected = undefined;
                }

                //set highlight to selected node
                selectedNode.selected = 'selected';

                //set currentNode
                $scope[treeId].currentNode = selectedNode;

            }
        });

        $scope.image_url = $scope.image_list[idx].file; // + '&t=' + new Date().getTime();
        // $scope.copy_dir_meta = true;

        if (!!$scope.current_image_timestamp) {
            $scope.last_image_timestamp = $scope.current_image_timestamp;
        }
        $scope.current_image_timestamp = $scope.image_list[idx].timestamp;

        if (!!$scope.current_image_dir_idx) {
            $scope.last_image_dir_idx = $scope.current_image_dir_idx;
        }
        $scope.current_image_dir_idx = $scope.dir_idx.indexOf($scope.image_list[idx].dir_path);

        $scope.current_image_idx = idx;

        var threshold = $scope.threshold;

        $scope.next_image_burst = false;
        if (!!$scope.image_list[idx + 1]) {
            $scope.next_image_timestamp = $scope.image_list[idx + 1].timestamp;
            $scope.next_image_dir_idx = $scope.dir_idx.indexOf($scope.image_list[idx + 1].dir_path);
            var next_time_diff = Math.abs($scope.current_image_timestamp - $scope.next_image_timestamp);
            if (next_time_diff <= threshold && ($scope.next_image_dir_idx == $scope.current_image_dir_idx)) {
                $scope.next_image_burst = true;
                $scope.in_serial = true;
            }
        }

        $scope.prev_image_burst = false;
        if (!!$scope.image_list[idx - 1]) {
            $scope.prev_image_timestamp = $scope.image_list[idx - 1].timestamp;
            $scope.prev_image_dir_idx = $scope.dir_idx.indexOf($scope.image_list[idx - 1].dir_path);
            var prev_time_diff = Math.abs($scope.current_image_timestamp - $scope.prev_image_timestamp);
            if (prev_time_diff <= threshold && ($scope.prev_image_dir_idx == $scope.current_image_dir_idx)) {
                $scope.prev_image_burst = true;
                $scope.in_serial = true;
            }
        }

        var time_diff = Math.abs($scope.current_image_timestamp - $scope.last_image_timestamp);
        if (time_diff <= threshold && ($scope.last_image_dir_idx == $scope.current_image_dir_idx)) {
            console.log('Time diff = ' + time_diff + ' second(s). Copy data!');
            $scope.auto_copy_all_tokens = (true && $scope.auto_copy_all_tokens_override) || $scope.force_auto_copy;
        } else {
            //console.log('Time diff = ' + time_diff + ' second(s). Noooooooo!');
            $scope.auto_copy_all_tokens = false;
            $scope.force_auto_copy = false;
        }

        //if ($scope.current_image_dir_idx != $scope.last_image_dir_idx) {
        //  $scope.copy_dir_meta = false;
        //}

        _getImageData();
        $scope.edit_token_form.$setPristine();
    }


    var _leaveAndSave = function() {

        if ($scope.edit_token_form.$dirty) {
            //var leaveAndSave = confirm("離開前存檔?");
            //if (leaveAndSave) {
            $scope.edit_token_form.$setPristine();
            //}
            //return leaveAndSave;
            return true;
        }
        return false;
    }

    $scope.switchImage = function(direction, e) {

        if (window.imageLock !== 0) {
            console.log("Stop!! Stop!! Stop!! Stop!! Stop!! Stop!! Stop!! Stop!! Stop!! Stop!! Stop!! Stop!! Stop!! Stop!!");
            return;
        }

        var last_image_idx = $scope.current_image_idx;
        var next_image_idx = $scope.current_image_idx;

        e.stopPropagation();

        switch (direction) {
            case "prev":
                if ($scope.current_image_idx > 0) {
                    var next_image_idx = $scope.current_image_idx - 1;
                }
                break;
            case "next":
            default:
                if ($scope.current_image_idx < $scope.image_list.length - 1) {
                    var next_image_idx = $scope.current_image_idx + 1;
                }
                break;
        }

        if (next_image_idx != $scope.current_image_idx) {

            if (_leaveAndSave()) {
                $scope.saveAnnotation();
            }

            $scope.current_image_idx = next_image_idx;
            _selectImage($scope.current_image_idx);
        }
    }

    var _getImageData = function(url, doCopyFromMe) {

        if (doCopyFromMe === undefined) doCopyFromMe = false;

        var doCopyFromMe = doCopyFromMe;

        if (!!url) {
            $scope.image_url = url;
        }

        if (!!$scope.image_url) {
            var query_id = $scope.current_query_id;
            $scope.current_query_id += 1;
            simpleQueryService.simpleQuery("mongo_load.php", { url: $scope.image_url, qid: query_id }, true)
                .then(function(ret) {
                    console.log(ret);
                    if (!ret.result || ret.result == 'null') {
                        ret = [];
                        var json_file = "annotation.empty.json";
                        ret.forEach(function(e) {
                            if (e.image_url == $scope.image_url) json_file = e.json_file;
                        })

                        simpleQueryService.simpleQuery(json_file, {})
                            .then(function(ret) {
                                ret.url = $scope.image_url;
                                $scope.tmpImageData = ret;
                                if (!doCopyFromMe) {
                                    startAnnotation(ret);
                                }
                            })
                    } else {
                        if (ret.query.qid === query_id) {
                            $scope.tmpImageData = ret.result;
                            if (!doCopyFromMe) {
                                startAnnotation(ret.result);
                            } else {
                                copyFromMe(ret.result);
                            }
                        }
                    }
                })
        } else {
            // should not happen
            alert("THIS SHOULD NOT HAPPEN!")
            simpleQueryService.simpleQuery("annotation.empty.json", {})
                .then(function(ret) {
                    $scope.tmpImageData = ret;
                    if (!doCopyFromMe) {
                        startAnnotation(ret);
                    }
                })
        }

    }


    $scope.copyFromPrev = function() {
        _getImageData($scope.image_list[$scope.current_image_idx - 1].file, true);
    }


    $scope.floodFillDirMeta = function() {
        var path = $scope.dir_idx[$scope.current_image_dir_idx];
        var post = {
            field: 'url',
            value: null,
            meta: {
                project_name: $scope.ann.meta.project_name || "",
                spatial_context_1: $scope.ann.meta.spatial_context_1 || "",
                spatial_context_2: $scope.ann.meta.spatial_context_2 || "",
                spatial_context_3: $scope.ann.meta.spatial_context_3 || "",
                project_scope_camera_id: $scope.ann.meta.project_scope_camera_id || ""
            }
        };

        var settings = $scope.settings;

        //simpleQueryService.simpleQuery("settings.json") // using post
        //  .then(function (settings) {

        post.value = settings[settings.os_type].web_base_path + $scope.dir_idx[$scope.current_image_dir_idx].replace(settings[settings.os_type].images_base_path, '');
        post.sessionId = $scope.conn._session_id;

        simpleQueryService.simpleQuery("mongo_save_meta.php", post, true) // using post
            .then(function(ret) {
                console.log('Contents saved');
                console.log(ret);

                if (typeof _callback == 'function') {
                    _callback(args);
                }

            });
        //  });
    }


    $scope.floodFillBurst = function() {
        if (!$scope.in_serial) return;

        $scope.saveAnnotation();

        var burst_start = getBurstTerminalIdx(-1);
        var burst_end = getBurstTerminalIdx(1);
        var bursts = [];

        var tokens = $scope.ann.tokens;
        var sp = [];
        if (!!tokens)
            tokens.forEach(function(token) {
                token.data.forEach(function(d) {
                    if (d.key == 'name-vernacular-zhtw') {
                        sp.push(d.value);
                    }
                });
            });
        var sp_string = sp.join(',');

        for (var i = burst_start; i <= burst_end; i++) {
            if (i != $scope.current_image_idx) {
                var cts = copyToSomewhere(i);
                bursts.push(cts);
                if ($scope[$scope.treeModel][$scope.currentDirIdx].children.length > 1) {
                    $scope[$scope.treeModel][$scope.currentDirIdx].children[i].comment = sp_string;
                }
            }
        }

        $scope.saveAnnotations(bursts);

    }

    var copyToSomewhere = function(idx) {

        var timestamp = $scope.image_list[idx].timestamp;
        var url = $scope.image_list[idx].file;

        var pjn = $scope.ann.meta.project_name;
        var sp1 = $scope.ann.meta.spatial_context_1;
        var sp2 = $scope.ann.meta.spatial_context_2;
        var sp3 = $scope.ann.meta.spatial_context_3;
        var cid = $scope.ann.meta.project_scope_camera_id;

        var old2New = {};
        var ret = {};
        ret.tokens = [];

        $scope.ann.tokens.forEach(function(t) {
            var tmp = new Token();
            tmp.create();
            var tmp_token_id = tmp.token_id;
            old2New[t.token_id] = tmp_token_id;
            tmp.cloneToken(t);
            tmp.token_id = tmp_token_id;
            ret.tokens.push(tmp);
        });

        ret.tokens.forEach(function(t) {
            if (!!t.meta && !!t.meta.parent_id) {
                t.meta.parent_id = old2New[t.meta.parent_id];
            }
        });

        var tmp_date = new Date(timestamp * 1000);

        ret.meta = {};

        ret.meta.project_name = pjn;
        ret.meta.spatial_context_1 = sp1;
        ret.meta.spatial_context_2 = sp2;
        ret.meta.spatial_context_3 = sp3;
        ret.meta.project_scope_camera_id = cid;

        ret.date = tmp_date.getFullYear() + '-' + ('00' + (parseInt(tmp_date.getMonth()) + 1)).substr(-2) + '-' + ('00' + tmp_date.getDate()).substr(-2);
        ret.time = ('00' + tmp_date.getHours()).substr(-2) + ':' + ('00' + tmp_date.getMinutes()).substr(-2) + ':' + ('00' + tmp_date.getSeconds()).substr(-2);

        ret.url = url;

        console.log('copying to specific photo');
        console.log('Save to ' + idx + ' ...');
        console.log(ret);

        return ret;

    }


    var copyFromMe = function(ret) {

        if (($scope.current_image_idx - 1) < $scope.dir[$scope.current_image_dir_idx].start || ($scope.current_image_idx - 1) > $scope.dir[$scope.current_image_dir_idx].end) {
            console.log("不在同一個目錄scope，不允許複製");
            return;
        }

        var pjn = ret.meta.project_name;
        var sp1 = ret.meta.spatial_context_1;
        var sp2 = ret.meta.spatial_context_2;
        var sp3 = ret.meta.spatial_context_3;
        var cid = ret.meta.project_scope_camera_id;

        var old2New = {};
        $scope.ann.tokens = [];
        ret.tokens.forEach(function(t) {
            var tmp = new Token();
            tmp.create();
            var tmp_token_id = tmp.token_id;
            old2New[t.token_id] = tmp_token_id;
            tmp.cloneToken(t);
            tmp.token_id = tmp_token_id;
            $scope.ann.tokens.push(tmp);
        });

        $scope.ann.tokens.forEach(function(t) {
            if (!!t.meta && !!t.meta.parent_id) {
                t.meta.parent_id = old2New[t.meta.parent_id];
            }
        });

        var tmp_date = new Date($scope.current_image_timestamp * 1000);

        if (!$scope.ann.meta) {
            $scope.ann.meta = {};
        }

        $scope.ann.meta.project_name = pjn;
        $scope.ann.meta.spatial_context_1 = sp1;
        $scope.ann.meta.spatial_context_2 = sp2;
        $scope.ann.meta.spatial_context_3 = sp3;
        $scope.ann.meta.project_scope_camera_id = cid;

        if (!$scope.ann.date) {
            $scope.ann.date = tmp_date.getFullYear() + '-' + ('00' + (parseInt(tmp_date.getMonth()) + 1)).substr(-2) + '-' + ('00' + tmp_date.getDate()).substr(-2);
        }
        if (!$scope.ann.time) {
            $scope.ann.time = ('00' + tmp_date.getHours()).substr(-2) + ':' + ('00' + tmp_date.getMinutes()).substr(-2) + ':' + ('00' + tmp_date.getSeconds()).substr(-2);
        }

        if (!$scope.ann.tokens.length) {
            var token_tpl = new Token();
            token_tpl.create();
            $scope.ann.tokens.push(token_tpl);
        }

        console.log('copied from previous photo');
        $scope.saveAnnotation();

    }


    var startAnnotation = function(ret) {

        if ($scope[$scope.treeId].currentNode && $scope[$scope.treeId].currentNode.dir) {
            var s = jQuery('span:contains("' + $scope[$scope.treeId].currentNode.dir.replace($scope.settings[$scope.settings.os_type].images_base_path, '') + '")').parent().find('span:contains("' + $scope[$scope.treeId].currentNode.name + '")');
            if (s.length) {
                var offsetTop = s.offset().top;
                jQuery('div#dir_img_tree').scrollTop(jQuery('div#dir_img_tree').scrollTop() + offsetTop - 100);
            }
        }


        var sub_callback = function(img_url, data) {
            // This is where you would add the new article to the DOM (beyond the scope of this tutorial)
            // console.log('New article published to category "' + topic + '" : ' + data.title);
            if (img_url == $scope.image_list[$scope.current_image_idx].file) {
                console.log('有人更新資料窩');
                var viewed = data['viewed'];

                //console.log(data);
                var tmp_ann = $scope.ann;
                $scope.ann = viewed['data'];
                $scope.$apply();

                //*

                if (!confirm("其他人可能修改了連拍照片的資料，若要顯示修改後的結果請選「是」，繼續編輯原資料請選「否」。")) {
                    $scope.edit_token_form.$setDirty();
                    $scope.ann = tmp_ann;
                    $scope.$apply();
                }
            }
            //*/
        }


        var sub_callback_getid = function(getid, id) {
            // console.log(data);
            $scope.conn_id = id;
        }

        var sub_callback_chat = function(msg, data) {
            // console.log(data);
            var chatroom = $('#chatroom');
            chatroom.append('<br/>');
            chatroom.append('<span>' + data + '</span>');
            chatroom.scrollTop(chatroom[0].scrollHeight - chatroom.height());

            var chatroom_rwd = $('#chatroom_rwd');
            chatroom_rwd.append('<br/>');
            chatroom_rwd.append('<span>' + data + '</span>');
            chatroom_rwd.scrollTop(chatroom_rwd[0].scrollHeight - chatroom_rwd.height());

        }

        var sub_callback_msg = function(msg, data) {
            var subers = JSON.parse(data['message']);
            var others = subers.length;
            $scope.subers_txt = "目前有" + others + "人在檢視此連拍 (id: " + subers.join(', ') + ")";
            $scope.$apply();
        }

        var sub_callback_dir = function(dir, data) {
            console.log('有人更新檔案樹窩');

            var effected = data['effected'];
            var meta = data['meta'];
            //console.log(data);

            var settings = $scope.settings;
            var sys_base = settings[settings.os_type].images_base_path;
            var web_base = settings[settings.os_type].web_base_path;

            var dir_found = false;
            var meta_updated = false;

            var sp_string = '';
            $scope[$scope.treeModel].some(function(node) {
                if (node.children.length) {
                    node.children.forEach(function(img_node) {
                        var eff_id = img_node.id.replace(sys_base, web_base);
                        if (!!effected[eff_id]) {
                            if (!dir_found) {
                                dir_found = true;
                                var tokens = effected[eff_id]['data'].tokens;
                                var sp = [];
                                if (!!tokens)
                                    tokens.forEach(function(token) {
                                        token.data.forEach(function(d) {
                                            if (d.key == 'name-vernacular-zhtw') {
                                                sp.push(d.value);
                                            }
                                        });
                                    });
                                sp_string = sp.join(',');
                            }
                            img_node.comment = sp_string;
                        }
                    });
                }
                return dir_found;
            });

            if (!!meta) {
                $scope.ann.meta = meta;
                meta_updated = true;
            }

            if (dir_found) {
                $scope.$apply();
            }

            if (meta_updated) {
                $scope.$apply();
            }

            //$scope.edit_token_form.$setDirty();
            //$scope.edit_token_form.$se
        }

        var subscribeSomething = function(url) {
            // 訂閱連拍
            var urls = [];
            if (!$scope.in_serial) {
                urls.push(url);
            } else {
                var burst_start = getBurstTerminalIdx(-1);
                var burst_end = getBurstTerminalIdx(1);
            }
            for (var i = burst_start; i <= burst_end; i++) {
                urls.push($scope.image_list[i].file);
            }

            var toUnsub = $($scope.subscriptions).not(urls).get();
            var toSub = $(urls).not($scope.subscriptions).get();

            toUnsub.forEach(function(img_url) {
                $scope.conn.unsubscribe(img_url);
                console.log("閃人了，看我秒退訂:" + img_url);
            });
            $scope.subscriptions = $($scope.subscriptions).not(toUnsub).get();

            toSub.forEach(function(img_url) {
                $scope.conn.subscribe(img_url, sub_callback);
                $scope.subscriptions.push(img_url);
                console.log("我訂~" + img_url);
            });
        }

        if (!$scope.conn) {
            console.log($scope.settings);

            var http_path = $scope.settings[$scope.settings['os_type']].web_base_path;
            var host = http_path.split('/')[2];
            $scope.conn = new ab.Session('ws://' + host + ':8080',
                function() {

                    // 檔案樹
                    $scope.conn.subscribe('dir', sub_callback_dir);
                    console.log("檔案樹也一起訂~");

                    // 連拍中的使用者
                    $scope.conn.subscribe('message', sub_callback_msg);
                    console.log("訂什麼訂");

                    // 聊天室?
                    $scope.conn.subscribe('chatroom', sub_callback_chat);
                    $scope.conn.publish('chatroom', '加入了聊天室 (系統訊息)');

                    $scope.conn.subscribe('getid', sub_callback_getid);
                    $scope.conn.publish('getid', '查你ID喔ㄏㄏ (系統訊息)');


                    subscribeSomething(ret.url);
                },
                function() {
                    console.warn('WebSocket connection closed');
                }, {
                    'skipSubprotocolCheck': true
                }
            );

        } else if ($scope.conn._websocket_connected) {
            subscribeSomething(ret.url);
        }

        /*
        if ($scope.copy_dir_meta && !!$scope.ann.meta) {
          var pjn = $scope.ann.meta.project_name;
          var sp1 = $scope.ann.meta.spatial_context_1;
          var sp2 = $scope.ann.meta.spatial_context_2;
          var sp3 = $scope.ann.meta.spatial_context_3;
          var cid = $scope.ann.meta.project_scope_camera_id;
        }
        //*/
        //
        var save_at_start = false;
        var copied = false;

        if (!!window.$mag) {
            window.$mag.destroy();
        }

        if (!$scope.auto_copy_all_tokens || (ret.tokens.length > 0 && !$scope.force_auto_copy)) {
            $scope.ann = {};
        } else {
            if (($scope.auto_copy_all_tokens && ret.tokens.length <= 0) || $scope.force_auto_copy) {
                copied = true;
            }
            var old2New = {};
            ret.tokens = [];
            $scope.ann.tokens.forEach(function(t) {
                var tmp = new Token();
                tmp.create();
                var tmp_token_id = tmp.token_id;
                old2New[t.token_id] = tmp_token_id;
                tmp.cloneToken(t);
                tmp.token_id = tmp_token_id;
                ret.tokens.push(tmp);
            });

            ret.tokens.forEach(function(t) {
                if (!!t.meta && !!t.meta.parent_id) {
                    t.meta.parent_id = old2New[t.meta.parent_id];
                }
            });

        }
        var ann_json = ret;

        $scope.ann.url = ann_json.url;
        var tmp_carrier_url = ann_json.carrier_url;
        $scope.ann.carrier_url = tmp_carrier_url;
        $scope.carrier_url = tmp_carrier_url;

        var tokens = [];

        for (var i = 0; i < ann_json.tokens.length; i++) {
            var token = new Token();
            token.cloneToken(ann_json.tokens[i]);
            if (!token.data) {
                token.data = [];
            } else {

                var standard_data = [];

                $scope.standard_data.forEach(function(d) {
                    var cloned_d = $.extend(true, {}, d);
                    standard_data.push(cloned_d);
                });

                var non_standards = [];

                token.data.forEach(function(d, i) {
                    var found = $scope.standard_data_key.indexOf(d.key);
                    if (found > -1) {
                        standard_data[found].value = d.value;
                        standard_data[found].unit = d.unit;
                    } else {
                        non_standards.push(d);
                    }
                });

                token.data = $.merge(standard_data, non_standards);

            }
            if (!token.relations) token.relations = [];
            token.tokens = [];
            tokens.push(token);
        }

        ann_json.tokens = tokens;

        ann_json.relations = undefined;

        $scope.ann = ann_json;
        var tmp_date = new Date($scope.current_image_timestamp * 1000);

        if (!$scope.ann.meta) {
            $scope.ann.meta = {};
        }

        /*
        if ($scope.copy_dir_meta) {

          if ($scope.ann.meta.project_name != pjn || 
              $scope.ann.meta.spatial_context_1 != sp1 || 
              $scope.ann.meta.spatial_context_2 != sp2 || 
              $scope.ann.meta.spatial_context_3 != sp3 || 
              $scope.ann.meta.project_scope_camera_id != cid
          ) {
            $scope.ann.meta.project_name = pjn;
            $scope.ann.meta.spatial_context_1 = sp1;
            $scope.ann.meta.spatial_context_2 = sp2;
            $scope.ann.meta.spatial_context_3 = sp3;
            $scope.ann.meta.project_scope_camera_id = cid;
            save_at_start = true;
            // $scope.edit_token_form.$setDirty();
          }
        }
        //*/

        if (!$scope.ann.date) {
            $scope.ann.date = tmp_date.getFullYear() + '-' + ('00' + (parseInt(tmp_date.getMonth()) + 1)).substr(-2) + '-' + ('00' + tmp_date.getDate()).substr(-2);
        }
        if (!$scope.ann.time) {
            $scope.ann.time = ('00' + tmp_date.getHours()).substr(-2) + ':' + ('00' + tmp_date.getMinutes()).substr(-2) + ':' + ('00' + tmp_date.getSeconds()).substr(-2);
        }

        if (!$scope.ann.tokens.length) {
            var token_tpl = new Token();
            token_tpl.create();
            $scope.ann.tokens.push(token_tpl);
        }

        if (copied || (!copied && save_at_start)) {
            console.log('save at start lo');
            $scope.saveAnnotation();
        }

        $scope.goto_image_idx = $scope.current_image_idx;

    }


    var Token = function() {

        this.isGroup = function() {
            if (!this.description_level) return false;
            var isGroup = false;
            this.description_level.split('-').forEach(function(part) {
                if ($scope.group_terms.indexOf(part) > -1) {
                    isGroup = true;
                }
            })
            return isGroup;
        }

        this.create = function() {
            this.token_id = Math.uuid().toLowerCase();

            this.description_level = 'individual';
            this.meta = {};
            this.meta.virtual_individual_id = Math.uuid().toLowerCase();
            this.meta.original_virtual_individual_id = this.meta.virtual_individual_id;
            this.meta.virtual_part_id = Math.uuid().toLowerCase();
            this.meta.original_virtual_part_id = this.meta.virtual_part_id;
            this.bbox = { full_scope: true, original_point: 'topleft' };
            this.cloneData($scope.standard_data);

            if ($scope.ann.time == '12:00:00') {
                $scope.edit_token_form.$setDirty();
                this.data.forEach(function(d) {
                    switch (d.key) {
                        case "name-scientific":
                            d.value = '12:00:00 test';
                            break;
                        case "name-vernacular-zhtw":
                            d.value = '12:00:00測試';
                            break;
                        default:
                            break;
                    }
                });
            }

            // $scope.edit_token_form.$setDirty();

            this.relations = [];
        }

        this.cloneToken = function(token) {
            this.token_id = _getUrlToken(token.token_id).token_id;
            this.description_level = token.description_level;
            this.cloneBBox(token.bbox);
            this.cloneMeta(token.meta);
            this.cloneData(token.data);
            this.cloneRel(token.relations);
        }

        this.cloneDataAndRelation = function(token) {
            this.cloneData(token.data);
            this.cloneRel(token.relations);
        }


        this.cloneBBox = function(bbox) {
            if (!bbox) {
                bbox = {};
            }
            this.bbox = $.extend(true, {}, bbox);
        }

        this.getBBox = function() {
            return $.extend(true, {}, this.bbox);
        }

        this.cloneMeta = function(meta) {
            if (!meta) {
                meta = {};
            }
            this.meta = $.extend(true, {}, meta);
        }

        this.cloneData = function(data) {
            if (!data) {
                data = [];
            }
            var cloned_data = [];
            data.forEach(function(d) {
                var cloned_d = $.extend(true, {}, d);
                cloned_data.push(cloned_d);
            });
            this.data = cloned_data;
        }

        this.cloneRel = function(rel) {
            if (!rel) {
                rel = [];
            }
            var cloned_rel = [];
            rel.forEach(function(r) {
                var cloned_r = $.extend(true, {}, r);
                cloned_r.object = _makeUrlToken(null, cloned_r.object);
                cloned_rel.push(cloned_r);
            });
            this.relations = cloned_rel;
        }

        this.removeEmptyDataEntry = function() {
            if (this.data.length == 0) return;
            this.data = this.data.filter(function(el) {
                if (!!el.key.toString().trim()) {
                    return true;
                } else {
                    return false;
                }
            })
        }

        this.removeEmptyRelEntry = function() {
            if (this.relations.length == 0) return;
            this.relations = this.relations.filter(function(el) {
                if (!!el.relation.toString().trim() && !!el.object.toString().trim()) {
                    return true;
                } else {
                    return false;
                }
            })
        }

    }


    var _getTokens = function(tokens) {
        var tmpTokens = [];
        tokens.forEach(function(t) {
            var tmp = new Token();
            var somesome = false;
            t.data.some(function(d) {
                if (d.value.trim() !== '') {
                    somesome = true;
                    return true;
                }
            });
            if (somesome) {
                tmp.cloneToken(t);
                tmpTokens.push(tmp);
            }
        });
        return tmpTokens;
    }

    var _pruneAnn = function(ann) {
        var tmpAnn = $.extend(true, {}, ann);
        delete(tmpAnn._id);
        tmpAnn.tokens = _getTokens(ann.tokens);
        tmpAnn.tokens.forEach(function(t) {
            t.tokens = undefined;
        });
        return tmpAnn;
    }

    var _makeUrlToken = function(url, token_id) {

        if (!token_id) return "";

        var frags = [];

        var test = _getUrlToken(token_id);
        var token_id = test.token_id;

        if (!!url) {
            frags.push(url);
        } else if (!!test.url) {
            frags.push(test.url);
        } else {
            frags.push($scope.ann.url);
        }

        frags.push(token_id);
        return frags.join('#');

    }


    var _getUrlToken = $scope.getUrlToken = function(urlToken) {
        if (!urlToken) return "";
        var urlToken = urlToken;
        var frags = urlToken.split('#');
        if (frags.length >= 2) {
            var token_id = null;
            var which = -1;
            frags.some(function(f, i) {
                if (f.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
                    token_id = f;
                    which = i;
                    return true;
                }
            });

            if (which > -1) {
                frags.splice(which, 1);
            }
            var url = frags.join('');
        } else {
            if (frags[0].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
                var token_id = frags[0];
                var url = $scope.ann.url;
            } else {
                var token_id = null;
                var url = frags[0];
            }
        }
        return {
            url: url,
            token_id: token_id
        }
    }

    $scope.send_chatroom_msg_by_enter = function(e) {
        if (e.key == 'Enter') {
            $scope.send_chatroom_msg();
        }
    }

    $scope.send_chatroom_msg = function() {
        if (!!$scope.conn) {
            if (!!$scope.chat_room_msg && !!$scope.chat_room_msg.trim()) {
                $scope.conn.publish('chatroom', $scope.chat_room_msg.trim());
            }
        }
        $scope.chat_room_msg = '';
    }

    $scope.camelShorten = function(s) {
        if (!s) return '';
        var parts = s.split(' ');
        var last = parts.pop();
        var front = '';
        parts.forEach(function(p) {
            front = p[0].toUpperCase() + front;
        });
        return front + last;
    }

    $scope.removeToken = function(idx) {
        $scope.ann.tokens.splice(idx, 1);
        $scope.edit_token_form.$setDirty();
    }

    $scope.addToken = function(idx) {
        var tmp = new Token();
        tmp.create();
        $scope.ann.tokens.push(tmp);
        $scope.edit_token_form.$setDirty();
    }


    $scope.saveAnnotations = function(anns, _callback) {

        var args = arguments;

        var dataToSave = [];

        anns.forEach(function(ann) {
            var tmp = _pruneAnn(ann);
            dataToSave.push(tmp);
        });

        var post = { batch: '1', data: dataToSave, sessionId: $scope.conn._session_id };

        simpleQueryService.simpleQuery("mongo_save.php", post, true) // using post
            .then(function(ret) {
                console.log('Contents saved');
                console.log(ret);

                if (typeof _callback == 'function') {
                    _callback(args);
                }

            });

    }

    $scope.saveAnnotation = function(ann, _callback) {

        var args = arguments;

        if (!!ann) {
            var dataToSave = _pruneAnn(ann);
        } else {
            var dataToSave = _pruneAnn($scope.ann);
        }

        var tokens = dataToSave.tokens;
        var sp = [];
        if (!!tokens)
            tokens.forEach(function(token) {
                token.data.forEach(function(d) {
                    if (d.key == 'name-vernacular-zhtw') {
                        sp.push(d.value);
                    }
                });
            });
        var sp_string = sp.join(',');

        if ($scope[$scope.treeModel][$scope.currentDirIdx].children.length > 1) {
            $scope[$scope.treeModel][$scope.currentDirIdx].children[$scope.current_image_idx].comment = sp_string;
        }


        $scope.edit_token_form.$setPristine();

        var post = { batch: '0', data: dataToSave, sessionId: $scope.conn._session_id };
        simpleQueryService.simpleQuery("mongo_save.php", post, true) // using post
            .then(function(ret) {
                console.log('Content saved');
                console.log(ret);

                if (typeof _callback == 'function') {
                    _callback(args);
                }

            });
    }

    $scope.formatJSON = function(obj) {
        if (!$.isEmptyObject(obj)) {
            return JSON.stringify(JSON.parse(angular.toJson(obj)), null, 4);
        }
    }

    $scope.uuid = function() {
        return Math.uuid().toLowerCase();
    }

    $scope.simpleSearch = function(data, merge) {
        if (!data) {
            var data = { contains: $scope.toSearch };
        } else if (!data.contains) {
            data.contains = '';
        }

        var merge = merge;
        if (!merge) {
            var merge = false;
        }

        if (_leaveAndSave()) {
            $scope.saveAnnotation();
        }

        simpleQueryService.simpleQuery("mongo_simple_query.php", data, post = true)
            .then(function(ret) {
                if (ret.result.length > 0) {
                    if (!merge) {
                        $scope.image_list = ret.result;
                    } else {
                        var merged = $.merge(ret.result, $scope.image_list).unique();
                        $scope.image_list = merged;
                    }

                    // localStorage.setItem('image_list', angular.toJson($scope.image_list));

                    if ($scope.idx_before_search == null || $scope.idx_before_search == undefined || $scope.idx_before_search == '') {
                        // localStorage.setItem('ibs', angular.toJson($scope.current_image_idx));
                        $scope.idx_before_search = $scope.current_image_idx;
                        localStorage.setItem('ibs', $scope.idx_before_search);

                        $scope.dir_before_search = $scope.currentDir;
                        localStorage.setItem('dbs', $scope.dir_before_search);

                        $scope.dir_idx_before_search = $scope.currentDirIdx;
                        localStorage.setItem('dibs', $scope.dir_idx_before_search);

                    }

                    var tree = [];
                    var dirs = [];
                    var dir_imgs = {};
                    var settings = $scope.settings;
                    var img_base_path = settings[settings.os_type].images_base_path;

                    ret.result.forEach(function(d, idx) {
                        if (dirs.indexOf(d.dir_path) < 0) {
                            dirs.push(d.dir_path);
                        }
                        if (!dir_imgs[d.dir_path]) {
                            dir_imgs[d.dir_path] = [];
                        }
                        dir_imgs[d.dir_path].push(d);

                    });

                    dirs.forEach(function(d) {
                        var dir_node = {};
                        dir_node.id = d;
                        dir_node.name = d.replace(img_base_path, '');
                        // node.children = [{id: ("dummy_node_" + idx), name:'click to load', children:[]}];
                        dir_node.children = [];
                        dir_node.is_dir = true;
                        dir_node.collapsed = true;
                        tree.push(dir_node);
                    });

                    tree[0].selected = 'selected';
                    $scope[$scope.treeId].currentNode = tree[0];
                    $scope.currentDirIdx = 0;
                    $scope.currentDir = tree[0].id;

                    $scope[$scope.treeModel] = tree;
                    $scope.searchList = dir_imgs;
                    $scope.search = true;

                    $scope.image_list = $scope.searchList[tree[0].id];



                    _dir_stats($scope.image_list);
                    _selectImage(0, search = true);
                }
            })
    }

    // upload on file select or drop
    $scope.upload = function(file) {
        Upload.upload({
            url: 'upload/url',
            data: { file: file, 'username': $scope.username }
        }).then(function(resp) {
            console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
        }, function(resp) {
            console.log('Error status: ' + resp.status);
        }, function(evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    };

    $scope.autoValueClicked = function(di, token, v) {
        var d = token.data[di];
        var token_id = token.token_id;
        d.value = v.vname.replace(/\(.+\)/g, '').replace(/ +/, ' ').trim().split(':')[0];
        $scope.showSelectionBox[token_id + "_" + d.key + "-di-" + di] = false;
        // 1 is scientific name
        switch (token.data[di].key) {
            case 'name-vernacular-zhtw':
                var new_vname = v.sciname.replace(/\(.+\)/g, '').replace(/ +/, ' ').trim().split(':')[0];
                if (token.data[1].value !== new_vname) {
                    token.data[1].value = v.sciname.replace(/\(.+\)/g, '').replace(/ +/, ' ').trim();
                    $scope.edit_token_form.$setDirty();
                }
                break;
            default:
                break;
        }
    }

    $scope.cellBlurred = function(e) {
        window.escapeTarget = e.target;
    }


    $scope.optsRotation = function(e, selectListId, di, token, v) {

        var parts = e.target.id.split('_');
        var parts_no_elmId = parts.slice(0, -1);
        var elmId = parseInt(parts[parts.length - 1]);
        var next = elmId + 1;
        var prev = elmId - 1;

        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault()
                if ($('#' + parts_no_elmId.join('_') + '_' + prev.toString()).length) {
                    $('#' + parts_no_elmId.join('_') + '_' + prev.toString()).focus();
                }
                break;
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault()
                if ($('#' + parts_no_elmId.join('_') + '_' + next.toString()).length) {
                    $('#' + parts_no_elmId.join('_') + '_' + next.toString()).focus();
                }
                break;
            case 'Escape':
                $scope.showSelectionBox[selectListId] = false;
                break;
            case 'Enter':
                $scope.autoValueClicked(di, token, v);
                break;
        }
    }

    $scope.autoValues = function(di, token, e) {

        if (!e) {
            $scope.ann.tokens.forEach(function(tkn) {
                $scope.standard_data_key.forEach(function(key, di) {
                    $scope.showSelectionBox[tkn.token_id + "_" + tkn.data[di].key + "-di-" + di] = false;
                });
            });
        }

        var d = token.data[di];
        var token_id = token.token_id;
        var txt = (!!d) ? d.value : '';
        var attrName = (!!d) ? d.key : 'NA';

        var valFromFile = '';

        switch (attrName) {
            case 'name-vernacular-zhtw':
                valFromFile = "splist_custom.csv";
                break;
            case 'life-stage':
                valFromFile = "life_stage.csv";
                break;
            case 'sex':
                valFromFile = "sex.csv";
                break;
            default:
                $scope.autoRes[attrName] = [];
                return;
        }

        if (!e) {
            $scope.showSelectionBox[token_id + "_" + d.key + "-di-" + di] = true;
        } else {
            if ((!e.target.value || e.key == 'ArrowDown') && !$scope.showSelectionBox[token_id + "_" + d.key + "-di-" + di]) {
                $scope.showSelectionBox[token_id + "_" + d.key + "-di-" + di] = true;
            } else if ((e.key == 'ArrowDown') && !!$scope.showSelectionBox[token_id + "_" + d.key + "-di-" + di]) {
                $('#opt_' + token.token_id + '_' + attrName + '_elmId_0').focus();
            } else if (e.key == 'Escape') {
                $scope.showSelectionBox[token_id + "_" + d.key + "-di-" + di] = false;
            }
        }

        if (txt === '') {
            // $scope.showSelectionBox[token_id + "_" + d.key + "-di-" + di] = false;
        }

        if ($.isEmptyObject($scope.autoRes[attrName])) {
            simpleQueryService.simpleQuery(valFromFile, {})
                .then(function(ret) {
                    var res = [];
                    var lines = ret.split('\n');
                    lines.forEach(function(line) {
                        if (line.length > 3) {
                            var cells = line.split('\t');
                            // res.push({namecode: cells[0], sciname: cells[1].replace(/\(.+\)/, '').replace(/ +/, ' ').trim(), vname: cells[2].split('(')[0].trim()});
                            res.push({ namecode: cells[0], sciname: cells[1].replace(/\(.+\)/, '').replace(/ +/, ' ').trim(), vname: cells[2] });
                        }
                    });
                    $scope.autoRes[attrName] = res;
                })
        }
    }

    $scope.treeId = 'dirImgTree';
    $scope.treeModel = 'dirImgList';

    if (!$scope[$scope.treeId]) $scope[$scope.treeId] = {};

    $scope[$scope.treeId].selectNodeHead = function(selectedNode) {
        //Collapse or Expand
        selectedNode.collapsed = !selectedNode.collapsed;
        if (!!selectedNode.is_dir && !selectedNode.loaded) {
            $scope[$scope.treeId].selectNodeLabel(selectedNode);
        }
    }

    $scope[$scope.treeId].selectNodeLabel = function(selectedNode) {
        var treeId = $scope.treeId;

        /*
    // Original codes in module
    //remove highlight from previous node
    if($scope[treeId].currentNode && $scope[treeId].currentNode.selected) {
      $scope[treeId].currentNode.selected = undefined;
    }
  
    //set highlight to selected node
    selectedNode.selected = 'selected';
  
    //set currentNode
    $scope[treeId].currentNode = selectedNode;

    //*/

        // My trick
        var settings = $scope.settings;
        var img_base_path = settings[settings.os_type].images_base_path;
        var dirImgListPath = settings[settings.os_type].web_base_path + selectedNode.id.replace(img_base_path, '');
        var found = false;
        if (!!selectedNode.is_image) {

            if (_leaveAndSave()) {
                $scope.saveAnnotation();
            }

            // Original codes in module
            //remove highlight from previous node
            if ($scope[treeId].currentNode && $scope[treeId].currentNode.selected) {
                $scope[treeId].currentNode.selected = undefined;
            }

            //set highlight to selected node
            selectedNode.selected = 'selected';

            //set currentNode
            $scope[treeId].currentNode = selectedNode;

            var selectImageFromList = function(image_list) {
                $scope.image_list.some(function(img, img_idx) {
                    if (img.file == selectedNode.id) {
                        $scope.current_image_idx = img_idx;
                        found = true;
                        return true;
                    }
                });
                if (!!found) {
                    _selectImage($scope.current_image_idx);
                } else {
                    // _selectImage(0);
                }
            }


            if (selectedNode.dir !== $scope.currentDir) {
                var dirImgListPath = settings[settings.os_type].web_base_path + selectedNode.dir.replace(img_base_path, '');
                $scope.currentDir = selectedNode.dir;

                $scope[$scope.treeModel].some(function(d, dirIdx) {
                    if ($scope.currentDir === d.id) {
                        $scope.currentDirIdx = dirIdx;
                        return true;
                    }
                });

                var search = $scope.search;
                if (!search) {
                    _getImageList(dirImgListPath + "/image_list_ct.json", selectImageFromList);
                } else {

                    $scope.image_list = $scope.searchList[selectedNode.dir];
                    _dir_stats($scope.image_list);
                    selectImageFromList($scope.image_list);
                    // _selectImage($scope.current_image_idx);

                }
            } else {
                selectImageFromList($scope.image_list);
            }

        } else if (!!selectedNode.is_dir && !selectedNode.loaded && !$scope.search) {
            simpleQueryService.simpleQuery(dirImgListPath + "/image_list_ct.json", {}, false)
                .then(function(ret) {
                    var files = [];
                    ret.forEach(function(d, idx) {
                        var node = {};
                        node.id = d.file;
                        node.name = d.file.replace(img_base_path, '').split('/').pop();
                        node.children = [];
                        node.dir = selectedNode.id;
                        files.push(node);
                    });

                    var data = { dir_path: selectedNode.id };
                    simpleQueryService.simpleQuery("mongo_load_dir.php", data, post = true)
                        .then(function(ret) {
                            files.forEach(function(f) {
                                if (f.id == $scope.image_list[$scope.current_image_idx].file) {

                                    if ($scope[treeId].currentNode && $scope[treeId].currentNode.selected) {
                                        $scope[treeId].currentNode.selected = undefined;
                                    }
                                    f.selected = 'selected';
                                    $scope[treeId].currentNode = f;

                                    var rel_path = data.dir_path.replace(img_base_path, '');
                                    var s = jQuery('span:contains("' + rel_path + '")').parent().find('span:contains("' + f.name + '")');
                                    if (s.length) {
                                        var offsetTop = s.offset().top;
                                        jQuery('div#dir_img_tree').scrollTop(jQuery('div#dir_img_tree').scrollTop() + offsetTop - 100);
                                    } else {
                                        if (!window.scrollToSelected) {
                                            window.scrollToSelected = setInterval(function() {
                                                (function(rel_path) {
                                                    var s = jQuery('span:contains("' + rel_path + '")').parent().find('span:contains("' + f.name + '")');
                                                    if (s.length) {
                                                        var offsetTop = s.offset().top;
                                                        clearInterval(window.scrollToSelected);
                                                        jQuery('div#dir_img_tree').scrollTop(jQuery('div#dir_img_tree').scrollTop() + offsetTop - 100);
                                                    }
                                                })(rel_path);

                                            }, 500);
                                        }
                                    }

                                }
                                if (!!ret.result[f.id]) {
                                    var tokens = ret.result[f.id].tokens;
                                } else {
                                    var tokens = [];
                                }

                                var sp = [];
                                if (!!tokens)
                                    tokens.forEach(function(token) {
                                        token.data.forEach(function(d) {
                                            if (d.key == 'name-vernacular-zhtw') {
                                                sp.push(d.value);
                                            }
                                        });
                                    });
                                var sp_string = sp.join(',');
                                f.comment = sp_string;
                                f.is_image = true;
                            });
                            selectedNode.loaded = true;
                            selectedNode.collapsed = false;
                            selectedNode.children = files;
                        });
                });
        } else if (!!selectedNode.is_dir && !selectedNode.loaded && !!$scope.search) {
            var files = [];
            var dir_image_list = $scope.searchList[selectedNode.id];
            dir_image_list.forEach(function(d, idx) {
                var node = {};
                node.id = d.file;
                node.name = d.file.replace(img_base_path, '').split('/').pop();
                node.children = [];
                node.dir = selectedNode.id;
                files.push(node);
            });

            var data = { dir_path: selectedNode.id };
            simpleQueryService.simpleQuery("mongo_load_dir.php", data, post = true)
                .then(function(ret) {
                    files.forEach(function(f) {
                        //*
                        if (f.id == $scope.image_list[$scope.current_image_idx].file) {

                            if ($scope[treeId].currentNode && $scope[treeId].currentNode.selected) {
                                $scope[treeId].currentNode.selected = undefined;
                            }
                            f.selected = 'selected';
                            $scope[treeId].currentNode = f;

                            var rel_path = data.dir_path.replace(img_base_path, '');
                            var s = jQuery('span:contains("' + rel_path + '")').parent().find('span:contains("' + f.name + '")');
                            if (s.length) {
                                var offsetTop = s.offset().top;
                                jQuery('div#dir_img_tree').scrollTop(jQuery('div#dir_img_tree').scrollTop() + offsetTop - 100);
                            } else {
                                if (!window.scrollToSelected) {
                                    window.scrollToSelected = setInterval(function() {
                                        (function(rel_path) {
                                            var s = jQuery('span:contains("' + rel_path + '")').parent().find('span:contains("' + f.name + '")');
                                            if (s.length) {
                                                var offsetTop = s.offset().top;
                                                clearInterval(window.scrollToSelected);
                                                jQuery('div#dir_img_tree').scrollTop(jQuery('div#dir_img_tree').scrollTop() + offsetTop - 100);
                                            }
                                        })(rel_path);

                                    }, 500);
                                }
                            }
                        }
                        //*/
                        var tokens = ret.result[f.id].tokens;
                        var sp = [];
                        if (!!tokens)
                            tokens.forEach(function(token) {
                                token.data.forEach(function(d) {
                                    if (d.key == 'name-vernacular-zhtw') {
                                        sp.push(d.value);
                                    }
                                });
                            });
                        var sp_string = sp.join(',');
                        f.comment = sp_string;
                        f.is_image = true;
                    });
                    selectedNode.loaded = true;
                    selectedNode.collapsed = false;
                    selectedNode.children = files;
                });
        } else if (!!selectedNode.is_dir && !!selectedNode.loaded) {
            selectedNode.collapsed = !selectedNode.collapsed;
        }

    };


    simpleQueryService.simpleQuery("settings.json") // using post
        .then(function(settings) {
            $scope.settings = settings;
            var img_base_path = settings[settings.os_type].images_base_path;
            var web_base_path = settings[settings.os_type].web_base_path;
            simpleQueryService.simpleQuery("dir_list_ct.json", {}, false)
                .then(function(ret) {
                    var tree = [];

                    if (!$scope.currentDir) {
                        if (!!localStorage.getItem('cd')) {
                            $scope.currentDir = localStorage.getItem('cd');
                        } else {
                            $scope.currentDir = ret[0];
                        }
                    }

                    ret.forEach(function(d, idx) {
                        var node = {};
                        node.id = d;
                        node.name = d.replace(img_base_path, '');
                        // node.children = [{id: ("dummy_node_" + idx), name:'click to load', children:[]}];
                        node.children = [];
                        node.is_dir = true;
                        node.collapsed = true;

                        if (!!$scope.currentDir && node.id == $scope.currentDir) {
                            node.selected = 'selected';
                            $scope[$scope.treeId].currentNode = node;
                            $scope.currentDirIdx = idx;
                        }

                        tree.push(node);
                    });
                    $scope[$scope.treeModel] = tree;
                    if (!$scope.currentDir) {
                        if (!parseInt(localStorage.getItem('cd'))) {
                            $scope.currentDir = tree[0].id;
                        }
                    }
                    var dirImgListPath = settings[settings.os_type].web_base_path + $scope.currentDir.replace(img_base_path, '');
                    _getImageList(dirImgListPath + '/image_list_ct.json', function(imList) { _selectImage($scope.current_image_idx) });
                });
        });

}]);

app.factory('simpleQueryService', ['$http', function($http) {
    var simpleQuery = function(url, reqData, post) {
        window.imageLock += 1;
        if (!post) {
            return $http.get(url, reqData)
                .then(
                    function(response) {
                        window.imageLock -= 1;
                        return response.data;
                    },
                    function(httpError) {
                        // translate the error
                        window.imageLock -= 1;
                        throw httpError.status + " : " +
                            httpError.data;
                    }
                );
        } else {
            return $http.post(url, reqData)
                .then(
                    function(response) {
                        window.imageLock -= 1;
                        return response.data;
                    },
                    function(httpError) {
                        // translate the error
                        window.imageLock -= 1;
                        throw httpError.status + " : " +
                            httpError.data;
                    }
                );
        }
    }
    return { simpleQuery: simpleQuery }
}]);

app.directive('imageonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('load', function() {
                //call the function that was passed
                scope.$apply(attrs.imageonload);
            });
        }
    };
});

app.filter('displayRelObject', function() {
    return function(obj, scope) {
        var obj = scope.getUrlToken(obj);
        if (obj.url == scope.ann.url) {
            return obj.token_id;
        }

        if (!obj.token_id) {
            return "";
        }

        return obj.url + '#' + obj.token_id;
    };
});

app.directive("ngMobileClick", ['$parse', function($parse) {
    return function(scope, elem, attrs) {
        elem.bind("touchstart click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            var mobileClickFunction = $parse(attrs['ngMobileClick']);
            mobileClickFunction(scope, { $event: event });
            scope.$apply();
        });
    }
}]);