import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { updateProfile, changePassword } from "../../services/api";
import { C } from "./constants";
import { fmtDate } from "./helpers";
import { Panel, Avatar, Input, Btn } from "./UI";

export default function CustomerProfile({ profile, setProfile, handleLogout }) {
  const [profileForm,   setProfileForm]   = useState({ name:"", email:"" });
  const [pwForm,        setPwForm]        = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw,      setSavingPw]      = useState(false);
  const [pwErrors,      setPwErrors]      = useState({});
  const [notifSettings, setNotifSettings] = useState({ email:true, push:true });
  const [savingNotif,   setSavingNotif]   = useState(false);

  useEffect(() => {
    if (profile) setProfileForm({ name:profile.name||"", email:profile.email||"" });
    if (profile?.settings?.notifications) setNotifSettings(profile.settings.notifications);
  }, [profile]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try { const {data}=await updateProfile(profileForm); setProfile(data.data||data); }
    catch { alert("Failed to update profile"); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    const e={};
    if(!pwForm.currentPassword) e.currentPassword="Required";
    if(pwForm.newPassword.length<6) e.newPassword="Min 6 characters";
    if(pwForm.newPassword!==pwForm.confirmPassword) e.confirmPassword="Passwords don't match";
    setPwErrors(e);
    if(Object.keys(e).length>0) return;
    setSavingPw(true);
    try {
      await changePassword({ currentPassword:pwForm.currentPassword, newPassword:pwForm.newPassword });
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch(err) { alert(err.response?.data?.message||"Failed to change password"); }
    finally { setSavingPw(false); }
  };

  const handleSaveNotif = async () => {
    setSavingNotif(true);
    try { await API.put("/profile/notifications",{ notifications:notifSettings }); }
    catch { alert("Failed to save preferences"); }
    finally { setSavingNotif(false); }
  };

  const Toggle = ({ checked, onChange, label }) => (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"12px 14px",background:"#f9fafb",borderRadius:9,marginBottom:8}}>
      <span style={{fontSize:13,fontWeight:500,color:C.text}}>{label}</span>
      <div onClick={()=>onChange(!checked)}
        style={{width:44,height:24,borderRadius:12,background:checked?C.green:"#ccc",
          position:"relative",cursor:"pointer",transition:"background .2s"}}>
        <div style={{position:"absolute",top:3,left:checked?22:3,width:18,height:18,
          borderRadius:"50%",background:"#fff",transition:"left .2s",
          boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Profile + Reputation */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Panel title="Personal Information" subtitle="Update your public profile details">
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,padding:"14px",background:"#f9fafb",borderRadius:10}}>
            <Avatar name={profile?.name||"?"} size={52} bg={C.gold} color={C.sidebar}/>
            <div>
              <div style={{fontWeight:600,fontSize:15}}>{profile?.name}</div>
              <div style={{fontSize:12,color:C.muted}}>{profile?.email}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                <span style={{fontSize:11,background:`${C.green}18`,color:C.green,padding:"2px 8px",borderRadius:20,fontWeight:600}}>
                  {profile?.reputation?.rank||"Starter"}
                </span>
                <span style={{fontSize:11,color:C.muted}}>Score: <b>{profile?.reputation?.score||0}</b></span>
              </div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Input label="Full Name" value={profileForm.name}
              onChange={v=>setProfileForm(p=>({...p,name:v}))} placeholder="Your name"/>
            <Input label="Email Address" value={profileForm.email}
              onChange={v=>setProfileForm(p=>({...p,email:v}))} placeholder="you@example.com"/>
            <Btn onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile?"Saving…":"Save Changes"}
            </Btn>
          </div>
        </Panel>
        <Panel title="Your Reputation" subtitle="Trust engine metrics">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[
              {label:"Trust Score",       value:profile?.reputation?.score||0,                      accent:C.green},
              {label:"Rank",              value:profile?.reputation?.rank||"Starter",                accent:C.gold},
              {label:"Successful Orders", value:profile?.reputation?.metrics?.successfulOrders||0,  accent:C.blue},
              {label:"Cancelled Orders",  value:profile?.reputation?.metrics?.cancelledOrders||0,   accent:C.red},
            ].map(s=>(
              <div key={s.label} style={{background:"#f9fafb",borderRadius:10,padding:"12px 14px",borderLeft:`3px solid ${s.accent}`}}>
                <div style={{fontSize:18,fontWeight:700,color:C.text}}>{s.value}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
            <span style={{color:C.muted}}>Trust Progress</span>
            <span style={{fontWeight:600,color:C.green}}>{profile?.reputation?.score||0}/100</span>
          </div>
          <div style={{height:8,background:"#e8ede9",borderRadius:4,overflow:"hidden"}}>
            <div style={{width:`${profile?.reputation?.score||0}%`,height:"100%",
              background:`linear-gradient(90deg,${C.green},${C.gold})`,borderRadius:4,transition:"width .6s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            {["Unverified","Starter","Trusted","Elite","Legendary"].map(r=>(
              <span key={r} style={{fontSize:9,color:C.muted}}>{r}</span>
            ))}
          </div>
        </Panel>
      </div>

      {/* Change password */}
      <Panel title="Change Password" subtitle="Keep your account secure">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <Input label="Current Password" type="password" value={pwForm.currentPassword}
            onChange={v=>setPwForm(p=>({...p,currentPassword:v}))} placeholder="••••••••" error={pwErrors.currentPassword}/>
          <Input label="New Password" type="password" value={pwForm.newPassword}
            onChange={v=>setPwForm(p=>({...p,newPassword:v}))} placeholder="••••••••" error={pwErrors.newPassword}/>
          <Input label="Confirm Password" type="password" value={pwForm.confirmPassword}
            onChange={v=>setPwForm(p=>({...p,confirmPassword:v}))} placeholder="••••••••" error={pwErrors.confirmPassword}/>
        </div>
        <div style={{marginTop:14}}>
          <Btn onClick={handleChangePassword} disabled={savingPw} variant="secondary">
            {savingPw?"Updating…":"Update Password"}
          </Btn>
        </div>
      </Panel>

      {/* Settings */}
      <Panel title="Notification Preferences" subtitle="Control how we reach you">
        <Toggle checked={notifSettings.email} label="📧 Email Notifications"
          onChange={v=>setNotifSettings(p=>({...p,email:v}))}/>
        <Toggle checked={notifSettings.push} label="🔔 Push Notifications"
          onChange={v=>setNotifSettings(p=>({...p,push:v}))}/>
        <div style={{marginTop:8}}>
          <Btn onClick={handleSaveNotif} disabled={savingNotif}>
            {savingNotif?"Saving…":"Save Preferences"}
          </Btn>
        </div>
      </Panel>

      {/* Account */}
      <Panel title="Account" subtitle="Manage your account data">
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{padding:"12px 14px",background:"#f9fafb",borderRadius:9,fontSize:13,color:C.muted}}>
            <b style={{color:C.text}}>Member since</b> — {fmtDate(profile?.createdAt)}
          </div>
          <div style={{padding:"12px 14px",background:"#f9fafb",borderRadius:9,fontSize:13,color:C.muted}}>
            <b style={{color:C.text}}>Account status</b> —{" "}
            <span style={{color:profile?.isVerified?C.green:C.red,fontWeight:600}}>
              {profile?.isVerified?"✓ Verified":"⚠ Not Verified"}
            </span>
          </div>
          <div style={{marginTop:4}}>
            <Btn variant="danger" onClick={handleLogout}>🚪 Log Out of Account</Btn>
          </div>
        </div>
      </Panel>
    </div>
  );
}