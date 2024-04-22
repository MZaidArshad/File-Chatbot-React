import React, { useEffect, useRef } from "react";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import "./chat.css";
import { Avatar } from "@mui/material";

const Chat = ({ conversation }) => {
  const messageEndRef = useRef(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // console.log("conversation in Chat", conversation);
  return (
    <div className="conversation">
      {conversation &&
        conversation.map((msg, index) => {
          if (msg.sender === "user") {
            return (
              <div className="message sent_msg" key={index}>
                <div className="sent_msg_msg">
                  <p className="msg_text">
                    {msg.message}
                    <span className="msg_time">{msg?.time}</span>
                  </p>
                  <Avatar
                    className="msg_avatar"
                    sx={{ width: "25px", height: "25px" }}
                  >
                    <PersonIcon className="icon" />
                  </Avatar>
                </div>
              </div>
            );
          } else if (msg.sender === "bot") {
            return (
              <div className="message recieved_msg" key={index}>
                <div className="recieved_msg_msg">
                  <Avatar
                    className="msg_avatar"
                    sx={{ width: "25px", height: "25px" }}
                  >
                    <SmartToyIcon className="icon" />
                  </Avatar>
                  <p
                    className="msg_text"
                    dangerouslySetInnerHTML={{ __html: msg.message }}
                  />
                </div>
              </div>
            );
          }
          return null;
        })}

      <div ref={messageEndRef}></div>
    </div>
  );
};

export default Chat;
