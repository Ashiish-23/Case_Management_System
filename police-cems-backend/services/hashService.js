const crypto = require("crypto");

function generateTransferHash(data) {

  const payload =
    data.evidence_id +
    data.from_station_id +
    data.to_station_id +
    data.initiated_by +
    (data.remarks || "") +
    data.created_at +
    data.previous_hash;

  return crypto.createHash("sha256").update(payload).digest("hex");
}

module.exports = { generateTransferHash };