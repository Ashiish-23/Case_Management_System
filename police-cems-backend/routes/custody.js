router.post("/transfer", auth, async(req,res)=>{

  const { evidenceId, fromLocation, toLocation, reason } = req.body;

  await pool.query(
    `INSERT INTO custody_transfers
     (evidence_id,from_location,to_location,transferred_by,transfer_reason)
     VALUES ($1,$2,$3,$4,$5)`,
    [evidenceId, fromLocation, toLocation, req.user.userId, reason]
  );

  res.json({ success:true });
});
