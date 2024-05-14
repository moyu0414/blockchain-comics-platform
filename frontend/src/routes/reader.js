import React, { useState } from "react";
import { Link } from "react-router-dom";

const Reader = () => {
  return (
    <div>
      <div className="row mt-5">
        <div className="col-3" >
            <Link to="#">
                <p>標題</p>
                <img src="#" alt={`Comic ${1}`} className="img-fluid" />
            </Link>
        </div>
      </div>
    </div>
    
  );
};

export default Reader;