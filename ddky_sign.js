const got = require('got')
const dayjs = require('dayjs')

const cur_time = dayjs(new Date()).format('YYYY-M-D H:m:s')
const notify = require('./sendNotify')
const loginInfo = [
  {
    // ddky_cookie: ' source=1227_sc_cj',
    ddky_token: 'f95bf09f8f418d6cee47f14a2f8ee30d',
    ddky_userid: '1017931028',
    ddky_udate: '43790820210223'
  },
  {
    // ddky_cookie: ' source=1227_sc_cj',
    ddky_token: '4c9390e8fa34c6e0f0fcf796ab6f9706',
    ddky_userid: '1019061031',
    ddky_udate: '74151120190829'
  }
]
const lottoryObj = {
  gain: [],
  cost: 0
}
const $ = {}

!(async () => {
  if (!loginInfo[0]) {
    console.log('【提示】请先获取叮当快药账号信息')
    return
  }
  for (let i = 0; i < loginInfo.length; i++) {
    $.index = i + 1
    console.log(`开始叮当账号${$.index}执行任务！`)
    if (loginInfo[i]) {
      let lottoryCount = true // 抽奖次数计数器
      let _ddky_sign = '' // 秘钥
      let _cookie = loginInfo[i]['ddky_cookie']
      let _token = loginInfo[i]['ddky_token']
      let _uid = loginInfo[i]['ddky_userid']
      let _udate = loginInfo[i]['ddky_udate']

      let lottory_method = 'ddky.cms.chouJiangActivity.onClickChouJiang' // 抽奖生成秘钥方法
      let sign_method = 'ddky.promotion.signin.pageinfo' // 签到生成秘钥方法
      let shareList_method = 'ddky.cms.toutiaoBottom.list' // 获取分享列表方法

      // 签到
      console.log('开始签到!')
      _ddky_sign = getSign(_token, _uid, _udate, sign_method)
      let signRes = await doSignIn(_ddky_sign, _token, _uid, _udate)
      console.log(signRes)
      if (signRes && signRes.result && signRes.result.signDayVo) {
        let _tempObj = signRes.result.signDayVo
        console.log(`签到结果： ${_tempObj.successMsg} \n获得${_tempObj.rewardsInfo}\n目前共有叮当币${signRes.result.coin}`)
        await notify.sendNotify(`叮当账号${$.index}`, `签到结果： ${_tempObj.successMsg} \n获得${_tempObj.rewardsInfo}\n目前共有叮当币${signRes.result.coin}`)
        // await notify.sendNotify(`${$.index}cookie已失效`, `叮当账号${$.index}\n请重新登录获取cookie`)
      }
      // 抽奖
      console.log('开始抽奖!')
      _ddky_sign = getSign(_token, _uid, _udate, lottory_method, '5220')
      while (lottoryCount) {
        let res = await doLottory(_ddky_sign, _token, _uid, _udate)
        // console.log(res)
        if (res.code == 0) {
          // 记录获取奖励
          lottoryObj.gain.push(res.result.name)
          lottoryObj.cost += res.result.coin
        } else if (res.code == 1000025) {
          lottoryCount = false
          console.log(`叮当快药账号${$.index}`, res.msg)
        } else if (res.code == 1005) {
          console.log('sing码错误')
          lottoryCount = false
        }
        if (res.code == 0 && res.countNum > 0) {
          lottoryCount = res.result.countNum
        }
      }
      console.log(lottoryObj)
      await notify.sendNotify(`叮当账号${$.index}抽奖结果`, `获得${lottoryObj.gain}, 消耗${lottoryObj.cost}`)
      // // 获取分享文章列表
      // console.log('获取分享文章列表!')
      // _ddky_sign = getSign(_token, _uid, _udate, shareList_method)
      // let shareListRes = await getShareList('4430A40450960DE14CED3E4DF0FE00F8', _token, _uid, _udate)
      // console.log(shareListRes)
    }
  }
})()
  .catch((e) => {
    console.log('', `❌ 叮当快药账号${$.index}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    console.log('完成！')
  })

async function doLottory(ddky_sign, _token, _uid, _udate) {
  let response = ''
  try {
    response = await got('https://api.ddky.com/cms/rest.htm', {
      method: 'GET',
      resolveBodyOnly: true,
      responseType: 'json',
      searchParams: {
        sign: ddky_sign,
        id: '5220',
        loginToken: _token,
        method: 'ddky.cms.chouJiangActivity.onClickChouJiang',
        plat: 'H5',
        platform: 'H5',
        t: cur_time,
        uDate: _udate,
        userId: _uid,
        v: '1.0',
        versionName: '4.9.0'
        // callback: 'Zepto1613810239541'
      },
      headers: {
        Host: 'api.ddky.com',
        Connection: 'keep-alive',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 5.1.1; LYA-AL10 Build/LMY47I; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/52.0.2743.100 Mobile Safari/537.36 ddky/android/5.9.5/5.1.1',
        Accept: '*/*',
        Referer: 'https://m.ddky.com/huodong/choujiangmd/index.html?activityId=5220&type=3',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,en-US;q=0.8',
        Cookie: 'source=1227_sc_cj',
        'X-Requested-With': 'com.ddsy.songyao'
      }
    })
  } catch (error) {
    console.log('错误: ', error)
  }

  return new Promise((resolve, reject) => {
    resolve(response)
  })
}

async function doSignIn(ddky_sign, _token, _uid, _udate) {
  let response = ''
  try {
    response = await got('https://api.ddky.com/mcp/weixin/rest.htm', {
      method: 'GET',
      resolveBodyOnly: true,
      responseType: 'json',
      searchParams: {
        sign: ddky_sign,
        loginToken: _token,
        method: 'ddky.promotion.signin.pageinfo',
        plat: 'H5',
        platform: 'H5',
        t: cur_time,
        uDate: _udate,
        userId: _uid,
        v: '1.0',
        versionName: '4.9.0'
      },
      headers: {
        Connection: 'close',
        Charset: 'utf-8',
        'http.agent': 'com.ddsy (Android 5.1.1; LYA-AL10 Build/LMY47I)',
        'Accept-Encoding': 'gzip,deflate',
        screenWidth: '720',
        city: '%E5%8C%97%E4%BA%AC%E5%B8%82',
        channelName: 'alisd',
        lng: '116.416637',
        uDate: _udate,
        versionName: '4.9.0',
        platform: 'H5',
        imei: 'IMEI865166022706371',
        loginToken: _token,
        screenHeight: '1280',
        macid: '00:81:3d:ba:e0:97',
        uid: _uid,
        imei0: '865166022706371',
        language: 'zh',
        lat: '39.922705',
        imsi: '89860001349446447866',
        model: 'LYA-AL10',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 5.1.1; LYA-AL10 Build/LMY47I)',
        Host: 'api.ddky.com'
      }
    })
  } catch (error) {
    console.log('错误: ', error)
  }
  return new Promise((resolve, reject) => {
    resolve(response)
  })
}

async function getShareList(ddky_sign, _token, _uid, _udate) {
  let response = ''
  console.log(cur_time)
  try {
    response = await got('https://api.ddky.com/cms/rest.htm', {
      method: 'GET',
      resolveBodyOnly: true,
      responseType: 'json',
      searchParams: {
        v: '1.0',
        sign: '4430A40450960DE14CED3E4DF0FE00F8',
        // t: '2021-02-23 17:59:12',
        t: cur_time,
        pageNo: '1',
        method: 'ddky.cms.toutiaoBottom.list',
        groupId: '10036',
        pageSize: '10'
      },
      headers: {
        'X-Tingyun-Id': 'p35OnrDoP8k;c=2;r=1312851859;u=ed53110d54764d1090818ad3b870efa7::EC1C67B5F12DB267',
        Connection: 'close',
        Charset: 'utf-8',
        'http.agent': 'com.ddsy (Android 5.1.1; LYA-AL10 Build/LMY47I)',
        'Accept-Encoding': 'gzip,deflate',
        screenWidth: 720,
        city: '%E5%8C%97%E4%BA%AC%E5%B8%82',
        channelName: 'alisd',
        lng: '116.416637',
        uDate: '67453420190617',
        versionName: '5.9.5',
        platform: 'android5.1.1',
        imei: 'IMEI865166022706371',
        loginToken: 'dcd4bf35a0a719d3aa912e2af1d716a5',
        screenHeight: '1280',
        macid: '00%3A81%3A3d%3Aba%3Ae0%3A97',
        uid: '1017931028',
        imei0: '865166022706371',
        language: 'zh',
        lat: '39.922705',
        imsi: '89860001349446447866',
        model: 'LYA-AL10',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 5.1.1; LYA-AL10 Build/LMY47I)',
        Host: 'api.ddky.com'
      }
    })
  } catch (error) {
    console.log('错误: ', error)
  }
  return new Promise((resolve, reject) => {
    resolve(response)
  })
}

function getSign(tk, uid, udate, method, activeid) {
  var paramMD5 = ''
  var secKey = '6C57AB91A1308E26B797F4CD382AC79D'
  // var secKey = 'V8E26BD7FN76D08C349A43D6D3M51A1B'
  // var secKey = '9A3Y8Q2X8RG7UBYBSASM0V0EDBON6F42'
  var curTime = new Date(),
    year = curTime.getFullYear(),
    month = curTime.getMonth() + 1,
    date = curTime.getDate(),
    hour = curTime.getHours(),
    mint = curTime.getMinutes(),
    sec = curTime.getSeconds(),
    fullTime = year + '-' + month + '-' + date + ' ' + hour + ':' + mint + ':' + sec
  var paraData = {
    loginToken: tk,
    method: method,
    plat: 'H5',
    platform: 'H5',
    t: cur_time,
    uDate: udate,
    userId: uid,
    v: '1.0',
    versionName: '4.9.0'
  }

  var paraDataArr = ['loginToken', 'method', 'plat', 'platform', 't', 'uDate', 'userId', 'v', 'versionName']
  if (activeid) {
    paraData['id'] = activeid
    paraDataArr.unshift('id')
  }
  for (var i in paraDataArr) {
    var g = paraDataArr[i]
    paramMD5 += g + paraData[g]
  }
  var tempMd5Params = paraData['method'] + paramMD5 + secKey
  function MD5(t) {
    function e(t, e) {
      return (t << e) | (t >>> (32 - e))
    }
    function n(t, e) {
      var n, r, i, o, a
      return (i = 2147483648 & t), (o = 2147483648 & e), (n = 1073741824 & t), (r = 1073741824 & e), (a = (1073741823 & t) + (1073741823 & e)), n & r ? 2147483648 ^ a ^ i ^ o : n | r ? (1073741824 & a ? 3221225472 ^ a ^ i ^ o : 1073741824 ^ a ^ i ^ o) : a ^ i ^ o
    }
    function r(t, e, n) {
      return (t & e) | (~t & n)
    }
    function i(t, e, n) {
      return (t & n) | (e & ~n)
    }
    function o(t, e, n) {
      return t ^ e ^ n
    }
    function a(t, e, n) {
      return e ^ (t | ~n)
    }
    function s(t, i, o, a, s, c, u) {
      return (t = n(t, n(n(r(i, o, a), s), u))), n(e(t, c), i)
    }
    function c(t, r, o, a, s, c, u) {
      return (t = n(t, n(n(i(r, o, a), s), u))), n(e(t, c), r)
    }
    function u(t, r, i, a, s, c, u) {
      return (t = n(t, n(n(o(r, i, a), s), u))), n(e(t, c), r)
    }
    function l(t, r, i, o, s, c, u) {
      return (t = n(t, n(n(a(r, i, o), s), u))), n(e(t, c), r)
    }
    function f(t) {
      for (var e, n = t.length, r = n + 8, i = (r - (r % 64)) / 64, o = 16 * (i + 1), a = Array(o - 1), s = 0, c = 0; c < n; ) (e = (c - (c % 4)) / 4), (s = (c % 4) * 8), (a[e] = a[e] | (t.charCodeAt(c) << s)), c++
      return (e = (c - (c % 4)) / 4), (s = (c % 4) * 8), (a[e] = a[e] | (128 << s)), (a[o - 2] = n << 3), (a[o - 1] = n >>> 29), a
    }
    function p(t) {
      var e,
        n,
        r = '',
        i = ''
      for (n = 0; n <= 3; n++) (e = (t >>> (8 * n)) & 255), (i = '0' + e.toString(16)), (r += i.substr(i.length - 2, 2))
      return r
    }
    function d(t) {
      t = t.replace(/\r\n/g, '\n')
      for (var e = '', n = 0; n < t.length; n++) {
        var r = t.charCodeAt(n)
        r < 128 ? (e += String.fromCharCode(r)) : r > 127 && r < 2048 ? ((e += String.fromCharCode((r >> 6) | 192)), (e += String.fromCharCode((63 & r) | 128))) : ((e += String.fromCharCode((r >> 12) | 224)), (e += String.fromCharCode(((r >> 6) & 63) | 128)), (e += String.fromCharCode((63 & r) | 128)))
      }
      return e
    }
    var h,
      v,
      m,
      g,
      y,
      b,
      _,
      x,
      w,
      $ = Array(),
      C = 7,
      T = 12,
      O = 17,
      k = 22,
      A = 5,
      S = 9,
      E = 14,
      j = 20,
      N = 4,
      P = 11,
      D = 16,
      L = 23,
      M = 6,
      I = 10,
      R = 15,
      F = 21
    for (t = d(t), $ = f(t), b = 1732584193, _ = 4023233417, x = 2562383102, w = 271733878, h = 0; h < $.length; h += 16)
      (v = b),
        (m = _),
        (g = x),
        (y = w),
        (b = s(b, _, x, w, $[h + 0], C, 3614090360)),
        (w = s(w, b, _, x, $[h + 1], T, 3905402710)),
        (x = s(x, w, b, _, $[h + 2], O, 606105819)),
        (_ = s(_, x, w, b, $[h + 3], k, 3250441966)),
        (b = s(b, _, x, w, $[h + 4], C, 4118548399)),
        (w = s(w, b, _, x, $[h + 5], T, 1200080426)),
        (x = s(x, w, b, _, $[h + 6], O, 2821735955)),
        (_ = s(_, x, w, b, $[h + 7], k, 4249261313)),
        (b = s(b, _, x, w, $[h + 8], C, 1770035416)),
        (w = s(w, b, _, x, $[h + 9], T, 2336552879)),
        (x = s(x, w, b, _, $[h + 10], O, 4294925233)),
        (_ = s(_, x, w, b, $[h + 11], k, 2304563134)),
        (b = s(b, _, x, w, $[h + 12], C, 1804603682)),
        (w = s(w, b, _, x, $[h + 13], T, 4254626195)),
        (x = s(x, w, b, _, $[h + 14], O, 2792965006)),
        (_ = s(_, x, w, b, $[h + 15], k, 1236535329)),
        (b = c(b, _, x, w, $[h + 1], A, 4129170786)),
        (w = c(w, b, _, x, $[h + 6], S, 3225465664)),
        (x = c(x, w, b, _, $[h + 11], E, 643717713)),
        (_ = c(_, x, w, b, $[h + 0], j, 3921069994)),
        (b = c(b, _, x, w, $[h + 5], A, 3593408605)),
        (w = c(w, b, _, x, $[h + 10], S, 38016083)),
        (x = c(x, w, b, _, $[h + 15], E, 3634488961)),
        (_ = c(_, x, w, b, $[h + 4], j, 3889429448)),
        (b = c(b, _, x, w, $[h + 9], A, 568446438)),
        (w = c(w, b, _, x, $[h + 14], S, 3275163606)),
        (x = c(x, w, b, _, $[h + 3], E, 4107603335)),
        (_ = c(_, x, w, b, $[h + 8], j, 1163531501)),
        (b = c(b, _, x, w, $[h + 13], A, 2850285829)),
        (w = c(w, b, _, x, $[h + 2], S, 4243563512)),
        (x = c(x, w, b, _, $[h + 7], E, 1735328473)),
        (_ = c(_, x, w, b, $[h + 12], j, 2368359562)),
        (b = u(b, _, x, w, $[h + 5], N, 4294588738)),
        (w = u(w, b, _, x, $[h + 8], P, 2272392833)),
        (x = u(x, w, b, _, $[h + 11], D, 1839030562)),
        (_ = u(_, x, w, b, $[h + 14], L, 4259657740)),
        (b = u(b, _, x, w, $[h + 1], N, 2763975236)),
        (w = u(w, b, _, x, $[h + 4], P, 1272893353)),
        (x = u(x, w, b, _, $[h + 7], D, 4139469664)),
        (_ = u(_, x, w, b, $[h + 10], L, 3200236656)),
        (b = u(b, _, x, w, $[h + 13], N, 681279174)),
        (w = u(w, b, _, x, $[h + 0], P, 3936430074)),
        (x = u(x, w, b, _, $[h + 3], D, 3572445317)),
        (_ = u(_, x, w, b, $[h + 6], L, 76029189)),
        (b = u(b, _, x, w, $[h + 9], N, 3654602809)),
        (w = u(w, b, _, x, $[h + 12], P, 3873151461)),
        (x = u(x, w, b, _, $[h + 15], D, 530742520)),
        (_ = u(_, x, w, b, $[h + 2], L, 3299628645)),
        (b = l(b, _, x, w, $[h + 0], M, 4096336452)),
        (w = l(w, b, _, x, $[h + 7], I, 1126891415)),
        (x = l(x, w, b, _, $[h + 14], R, 2878612391)),
        (_ = l(_, x, w, b, $[h + 5], F, 4237533241)),
        (b = l(b, _, x, w, $[h + 12], M, 1700485571)),
        (w = l(w, b, _, x, $[h + 3], I, 2399980690)),
        (x = l(x, w, b, _, $[h + 10], R, 4293915773)),
        (_ = l(_, x, w, b, $[h + 1], F, 2240044497)),
        (b = l(b, _, x, w, $[h + 8], M, 1873313359)),
        (w = l(w, b, _, x, $[h + 15], I, 4264355552)),
        (x = l(x, w, b, _, $[h + 6], R, 2734768916)),
        (_ = l(_, x, w, b, $[h + 13], F, 1309151649)),
        (b = l(b, _, x, w, $[h + 4], M, 4149444226)),
        (w = l(w, b, _, x, $[h + 11], I, 3174756917)),
        (x = l(x, w, b, _, $[h + 2], R, 718787259)),
        (_ = l(_, x, w, b, $[h + 9], F, 3951481745)),
        (b = n(b, v)),
        (_ = n(_, m)),
        (x = n(x, g)),
        (w = n(w, y))
    var U = p(b) + p(_) + p(x) + p(w)
    return U.toUpperCase()
  }
  return MD5(tempMd5Params)
}
