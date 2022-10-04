 window.onload = function () {
        const list = document.getElementById('photo-list');
        const lightbox = document.getElementById('lightbox');
        const close = document.getElementById('lightbox-close');
        const view = document.getElementById('photo-view');
        const index_view = document.getElementById('photo-index');
        const loading = document.getElementById('loading');
        const photo_count = list.querySelectorAll('li').length;
        let current_photo = 0;
        
        Array.prototype.forEach.call(list.querySelectorAll('li'), function(item, index) {
            item.onclick = function () {
                //console.log("사진 클릭");
                const agent = navigator.userAgent.toLowerCase();
                if ((navigator.appName == 'Netscape' && agent.indexOf('trident') != -1) || (agent.indexOf("msie") != -1)) {
                    // don't open lightbox in IE
                    window.open(item.getAttribute('data-hr'), '_blank');
                }else{
                    current_photo = index;
                    updatePhoto();
                }
            };
        });
        
        let images = [];

        function preload() {
          for(let i = 0; i < preload.arguments.lenght; i++) {
            images[i] = new Image();
            images[i].src = preload.arguments.src;
          }
        }
        preload(
            "./photo/1.jpg",
            "./photo/2.jpg",
            "./photo/3.jpg",
            "./photo/4.jpg",
            "./photo/5.jpg",
            "./photo/6.jpg"
        );
        
        view.onload = function () {
            ratio_y = this.naturalWidth / this.naturalHeight * window.innerHeight / window.innerWidth;
            loading.style.visibility = 'hidden';
            view.style.visibility = 'inherit';
        };

        close.onclick = function () {
            history.back();
        };

        window.onpopstate = function (ev) {
            if (!ev.state) {
                closeLightbox();
            } else {
                current_photo = ev.state;
                updatePhoto();
            }
        }; 

        const mc = new Hammer.Manager(lightbox);
        const pan = new Hammer.Pan();
        const pinch = new Hammer.Pinch(); 

        let ratio_y = 1;
        let base_x = 0;
        let base_y = 0;
        let base_scale = 1;
        let offset_x = 0;
        let offset_y = 0;
        let consume_pan = 0;
        let tx = 0;
        let ty = 0;
        let scale = 1;
        let swipe_threshold = window.innerWidth / 2; 

        function resetTransform() {
            base_x = 0;
            base_y = 0;
            base_scale = 1;
            tx = 0;
            ty = 0;
            view.style.transform = '';
        } 

        function updatePhoto() {
            
            index_view.textContent = (current_photo + 1) + '/' + photo_count;
            const item = list.querySelectorAll('li').item(current_photo);
            const itemsrc = item.getAttribute('data-hr');
            //console.log("view.src : "+view.src);
            //console.log("itemsrc : "+itemsrc);
            if (view.src != itemsrc) {
                loading.style.visibility = 'inherit';
                view.style.visibility = 'hidden';
                view.src = itemsrc;
                resetTransform();
            }
            //console.log("history.state:"+history.state);            
            //console.log("current_photo:"+current_photo);
            if (history.state && history.state != current_photo) {
                history.replaceState(current_photo, document.title);
            } else {
                openLightbox();
                history.pushState(current_photo, document.title);
            }
        } 

        function openLightbox() {
            lightbox.style.visibility = 'inherit';
        } 

        function closeLightbox() {
            lightbox.style.visibility = 'hidden';
            view.src = "";
            resetTransform();
        } 

        function swipeOffset() {
            const minscale = Math.max(0, base_scale - 1);
            if (tx > window.innerWidth * minscale / 2) {
                return tx - window.innerWidth * minscale / 2;
            }
            
            if (tx < -window.innerWidth * minscale / 2) {
                return tx + window.innerWidth * minscale / 2;
            }
            return 0;
        } 

        function verticalOffset() {
            const minscale = Math.max(0, base_scale / ratio_y - 1);
            if (ty > window.innerHeight * minscale / 2) {
                return ty - window.innerHeight * minscale / 2;
            }
            
            if (ty < -window.innerHeight * minscale / 2) {
                return ty + window.innerHeight * minscale / 2;
            }
            return 0;
        }

        pan.recognizeWith(pinch);
        mc.add([pan, pinch]); 

        mc.on("pan", function (ev) {
            if (consume_pan > 0) {
                consume_pan--;
                return;
            }

            tx = base_x + ev.deltaX - offset_x;
            ty = base_y + ev.deltaY - offset_y;

            view.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + base_scale + ')';

            const swipe_offset = Math.abs(swipeOffset());

            view.style.opacity = Math.max(Math.min(1, 1 - swipe_offset / swipe_threshold), .25).toString();
        });

        mc.on("panstart", function (ev) {
            swipe_threshold = window.innerWidth / 4;
            offset_x = ev.deltaX;
            offset_y = ev.deltaY;
        });

        mc.on("panend", function (ev) {
            view.style.opacity = '1';
            const swipe_offset = swipeOffset();
            if (swipe_offset > swipe_threshold) {
                current_photo--;
                if (current_photo < 0) {
                    current_photo = photo_count - 1;
                }
                updatePhoto();
                return;
            } else if (swipe_offset < -swipe_threshold) {
                current_photo++;
                if (current_photo >= photo_count) {
                    current_photo = 0;
                }
                updatePhoto();
                return;
            }

            if (base_scale < 1) {
                base_scale = 1;
            }

            if (base_scale > 10) {
                tx *= 10 / base_scale;
                ty *= 10 / base_scale;
                base_scale = 10;
            }

            tx -= swipeOffset();
            ty -= verticalOffset();
            base_x = tx;
            base_y = ty;
            view.style.transform = 'translate(' + base_x + 'px,' + base_y + 'px) scale(' + base_scale + ')';
        });

        mc.on("pinch", function (ev) {
            tx = base_x * ev.scale + ev.center.x - offset_x;
            ty = base_y * ev.scale + ev.center.y - offset_y;
            scale = base_scale * ev.scale;
            view.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
        });

        mc.on("pinchstart", function (ev) {
            base_x = tx;
            base_y = ty;
            offset_x = ev.center.x;
            offset_y = ev.center.y;
        });

        mc.on("pinchend", function (ev) {
            base_scale = scale;
            base_x = tx;
            base_y = ty;
            consume_pan = 1;
        });
    }
    
    function bank_close(n) {
        let li = document.getElementsByClassName('link_bank')[n].parentElement;
        li.classList.toggle("on");
    }
    
    function bank_copy(n) {
        let text = document.getElementsByClassName('link_copy')[n].parentElement.getElementsByClassName('num_bank')[0].innerHTML;
        const clip = document.getElementById('clip_target');
        clip.value = text;
        clip.focus();
        clip.select();
        
        document.execCommand('copy');
        alert('계좌번호가 복사 되었습니다.');
    }
    
    Kakao.init('bd5b5917a43199eca0491703ca95c639');
    // 카카오링크 버튼을 생성합니다. 처음 한번만 호출하면 됩니다.
    function shareKakaotalk(){
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: '정연호 ♡ 최지은 결혼식에 초대합니다.',
                description: '2022년 11월 19일(토) 오후 12시\n센텀사이언스파크 웨딩홀',
                imageUrl: location.href+'/photo/main_photo.jpg',
                link: {
                    mobileWebUrl: location.href,
                    webUrl: location.href
                }
            },
            buttons: [{
                    title: '청첩장 보러가기',
                    link: {
                        mobileWebUrl: location.href,
                        webUrl: location.href
                    }
                }
            ]
        });
    }
    
    function shareUrl() {
        const clip = document.getElementById('clip_target');
        const text_url    = location.href;
        clip.value = text_url;
        clip.focus();
        clip.select();
        
        document.execCommand('copy');
        alert('청첩장 url이 복사 되었습니다.');
    }
    
    let fyi = document.getElementsByClassName('fyi');
    fyi[0].style.marginLeft = fyi[0].clinetWidth/2;

    let map;
    let directionsService;
    let directionsRenderer;

    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 35.1739629, lng: 129.1262474},
            zoom: 14,
            controlSize: 24,
        });
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);
        const raum_marker = new google.maps.Marker({
            position: new google.maps.LatLng(35.1739629, 129.1262474),
            icon: {anchor: new google.maps.Point(24, 60), scaledSize: new google.maps.Size(48, 60)},
            map: map
        });
        const bus_marker = new google.maps.Marker({
            position: new google.maps.LatLng(35.169945, 129.132088),
            icon: {url: '/bus.png', anchor: new google.maps.Point(24, 60), scaledSize: new google.maps.Size(48, 60)},
            map: map
        });
    }
