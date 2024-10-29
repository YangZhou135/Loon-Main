// 获取请求的 URL
const url = $request.url;

// 判断当前环境是否为 QuanX，根据是否定义 $task
const isQuanX = typeof $task !== "undefined";

// 获取请求头信息
let header = $request.headers;

// 判断是否存在响应对象（即判断是否为响应阶段）
if (typeof $response === "undefined") {
  // 设置固定的设备令牌
  const cyTK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJ1c2VyX2lkIjoiNWY1YmZjNTdkMmM2ODkwMDE0ZTI2YmI4Iiwic3ZpcF9leHBpcmVkX2F0IjoxNzA1MzMxMTY2LjQxNjc3MSwidmlwX2V4cGlyZWRfYXQiOjB9.h_Cem89QarTXxVX9Z_Wt-Mak6ZHAjAJqgv3hEY6wpps";
  // 在请求头中设置设备令牌
  header["device-token"] = cyTK;

  // 检查版本号是否大于 7.19.0
  if (compareVersions(header.version, "7.19.0") > 0) {
    // 根据是否为 QuanX 环境选择不同的授权头字段名称
    if (isQuanX) {
      header["Authorization"] = "Bearer " + cyTK;
    } else {
      header["authorization"] = "Bearer " + cyTK;
    }
  }
  // 返回修改后的请求头
  $done({ headers: header });
} else {
  // 解析响应体中的 JSON 对象
  let obj = JSON.parse($response.body);

  // 检查 URL 是否包含特定路径，用于活动接口
  if (url.includes("/api.caiyunapp.com/v1/activity")) {
    // 检查活动类型是否为 "A03"（特定活动类型）
    if (url.includes("&type_id=A03&")) {
      // 若活动对象中包含间隔时间字段，设置为 30 天（秒为单位）
      if (obj?.interval) {
        obj.interval = 2592000; // 30天===2592000秒
      }
      // 若活动数组中有元素，将其 feature 字段设为 false
      if (obj?.activities?.length > 0) {
        for (let item of obj.activities) {
          if (item?.name && item?.type && item?.feature) {
            item.feature = false;
          }
        }
      }
    } else {
      // 对于其他活动请求，返回预定义的响应结构
      obj = { status: "ok", activities: [{ items: [] }] };
    }
  } else if (url.includes("/api/v1/user_detail")) {
    // 针对用户详情的接口请求
    if (obj?.vip_info?.show_upcoming_renewal) {
      // 隐藏即将续费的提示
      obj.vip_info.show_upcoming_renewal = false;
    }
    if (obj?.vip_info?.svip) {
      // 若用户有超级 VIP，设置自动续费并更改过期时间为一个很远的时间
      obj.vip_info.svip.is_auto_renewal = true;
      obj.vip_info.svip.expires_time = "3742732800";
    }
  } else if (url.includes("/wrapper.cyapi.cn/v1/activity")) {
    // 针对彩云推广的活动接口
    if (["&type_id=A03&"]?.includes(url)) {
      // 设置间隔时间为 30 天
      if (obj?.interval) {
        obj.interval = 2592000;
      }
      // 清空活动数组
      if (obj?.activities?.length > 0) {
        obj.activities = [];
      }
    } else {
      // 对于其他推广活动请求，返回预定义的响应结构
      obj = { status: "ok", activities: [{ items: [] }] };
    }
  } else if (url.includes("/v1/vip_info")) {
    // 针对 VIP 信息的接口请求
    if (obj?.vip) {
      // 设置 VIP 过期时间为一个很远的时间
      obj.vip.expires_time = "4030000000";
    }
    if (obj?.svip) {
      // 设置超级 VIP 过期时间
      obj.svip.expires_time = "4030000000";
    }
    if (obj?.show_upcoming_renewal) {
      // 隐藏即将续费的提示
      obj.show_upcoming_renewal = false;
    }
  } else if (url.includes("/v2/user")) {
    // 针对用户信息的接口请求
    if (obj?.result) {
      // 设置超级 VIP 天数、电话验证状态等相关信息
      obj.result.svip_given = 730;
      obj.result.is_phone_verified = true;
      obj.result.is_xy_vip = true;
      obj.result.vip_expired_at = 4030000000.16;
      obj.result.is_vip = true;
      obj.result.xy_svip_expire = 4030000000.16;

      // 检查用户是否拥有 VIP
      if (obj?.result?.wt) {
        if (obj.result.wt.vip) {
          obj.result.wt.vip.enabled = true;
          obj.result.wt.vip.expired_at = 4030000000.16;
          obj.result.wt.vip.svip_expired_at = 4030000000.16;
        }
        obj.result.wt.svip_given = 730;
      }

      // 设置为主要用户，延长 VIP 过期时间
      obj.result.is_primary = true;
      obj.result.xy_vip_expire = 4030000000.16;
      obj.result.svip_expired_at = 4030000000.16;
      obj.result.vip_type = "s";
    }
  }

  // 将修改后的响应体 JSON 化并返回
  $done({ body: JSON.stringify(obj) });
}

// 版本比较函数，用于比较两个版本号
function compareVersions(t, r) {
  // 将版本号按"."分割并转化为数字数组
  const e = t.split(".").map(Number);
  const n = r.split(".").map(Number);

  // 循环遍历两个版本数组的每一部分
  for (let t = 0; t < Math.max(e.length, n.length); t++) {
    const r = e[t] || 0; // 若当前版本部分不存在，则默认值为 0
    const i = n[t] || 0;
    if (r > i) return 1; // 若 t 版本大于 r 版本，返回 1
    if (r < i) return -1; // 若 t 版本小于 r 版本，返回 -1
  }

  // 若两个版本相等，返回 0
  return 0;
}
