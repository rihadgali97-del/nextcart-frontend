import React from "react";
import { Avatar, Spinner } from "./UI";

export default function CustomerMessages({
  colors,
  conversations,
  activeChat,
  chatMessages,
  conversationsLoading,
  chatLoading,
  profile,
  chatInput,
  setChatInput,
  openChat,
  setActiveChat,
  sendMessage,
  chatBottomRef,
  avatarColor,
  ago,
}) {
  const C = colors;

  return (
    <div style={{display:"flex",height:"calc(100vh - 130px)",background:C.card,borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 2px 16px rgba(0,0,0,.06)"}}>
      <div style={{width:280,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"16px 18px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:10}}>Messages</div>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:C.muted}}>🔍</span>
            <input placeholder="Search conversations…" style={{width:"100%",padding:"7px 10px 7px 28px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,outline:"none",boxSizing:"border-box",background:"#f9fafb"}}/>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {conversationsLoading?<div style={{padding:"30px 0",textAlign:"center"}}><Spinner/></div>
            :conversations.length===0?<div style={{padding:"40px 20px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>💬</div><div style={{fontSize:12,color:C.muted}}>No conversations yet</div></div>
            :conversations.map((conversation,index)=>{
              const otherId=conversation._id||conversation.userDetails?._id, otherName=conversation.userDetails?.name||"Unknown";
              const isActive=activeChat?._id===otherId, unread=conversation.unread||0;
              return(
                <div key={otherId||index} onClick={()=>openChat(conversation)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer",transition:"all .15s",background:isActive?C.sidebar:"#fff",borderBottom:`1px solid ${C.border}`}}
                  onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="#f5f7f5";}}
                  onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="#fff";}}>
                  <div style={{position:"relative"}}>
                    <Avatar name={otherName} size={42} bg={avatarColor(otherName)}/>
                    <div style={{position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:"#22c55e",border:"2px solid #fff"}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                      <div style={{fontWeight:600,fontSize:13,color:isActive?"#fff":C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{otherName}</div>
                      {unread>0&&<span style={{background:C.red,color:"#fff",fontSize:9,fontWeight:700,minWidth:16,height:16,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",flexShrink:0}}>{unread}</span>}
                    </div>
                    <div style={{fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:isActive?"rgba(255,255,255,.6)":C.muted}}>{conversation.lastMessage||"Start a conversation"}</div>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
      {!activeChat?(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:C.muted}}>
          <div style={{fontSize:56,marginBottom:14}}>💬</div>
          <div style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:6}}>Select a conversation</div>
          <div style={{fontSize:13}}>Choose a chat from the left to start messaging</div>
        </div>
      ):(
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,background:"#fafbfa"}}>
            <Avatar name={activeChat.name} size={38} bg={avatarColor(activeChat.name)}/>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:C.text}}>{activeChat.name}</div><div style={{fontSize:11,color:"#22c55e",fontWeight:500}}>● Online</div></div>
            <button onClick={()=>setActiveChat(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted,padding:"4px 8px"}}>×</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:10,background:"#f8fafb"}}>
            {chatLoading?<div style={{textAlign:"center",padding:"40px 0"}}><Spinner size={22}/></div>
              :chatMessages.length===0?<div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:32,marginBottom:8}}>👋</div><div style={{fontSize:12,color:C.muted}}>Say hello to {activeChat.name}!</div></div>
              :chatMessages.map((message,index)=>{
                const isOwn=message.sender===profile?._id||message.sender?._id===profile?._id||message.senderId===profile?._id;
                return(<div key={message._id||index} style={{display:"flex",justifyContent:isOwn?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
                  {!isOwn&&<Avatar name={activeChat.name} size={28} bg={avatarColor(activeChat.name)}/>}<div style={{maxWidth:"68%"}}>
                    <div style={{padding:"10px 14px",borderRadius:isOwn?"18px 18px 4px 18px":"18px 18px 18px 4px",background:isOwn?C.sidebar:"#fff",color:isOwn?"#fff":C.text,fontSize:13,lineHeight:1.5,boxShadow:"0 1px 4px rgba(0,0,0,.08)",opacity:message.pending?.7:1}}>{message.text}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:3,textAlign:isOwn?"right":"left"}}>{message.createdAt?ago(message.createdAt):"sending…"}{isOwn&&!message.pending&&<span style={{color:C.green,marginLeft:4}}>✓</span>}</div>
                  </div>{isOwn&&<Avatar name={profile?.name||"?"} size={28} bg={C.gold} color={C.sidebar}/>} 
                </div>);
              })
            }
            <div ref={chatBottomRef}/>
          </div>
          <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center",background:"#fff"}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder={`Message ${activeChat.name}…`} style={{flex:1,padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:24,fontSize:13,outline:"none",background:"#f9fafb",transition:"border-color .15s"}} onFocus={e=>e.target.style.borderColor=C.green} onBlur={e=>e.target.style.borderColor=C.border}/>
            <button onClick={sendMessage} disabled={!chatInput.trim()} style={{width:40,height:40,borderRadius:"50%",border:"none",background:chatInput.trim()?C.sidebar:"#e8ede9",color:chatInput.trim()?C.gold:C.muted,cursor:chatInput.trim()?"pointer":"not-allowed",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0}}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}