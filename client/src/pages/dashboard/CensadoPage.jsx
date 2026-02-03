import React, { useEffect, useState, useCallback } from "react";
import { censusAPI } from "../../services/api";
import { MaterialReactTable } from "material-react-table";

const columns = [
    
]



export default function CensadoPage() {
    const fetchCensusData =  useCallback(async () => {
      try {
        const res = await censusAPI.getCensus();
        return res.data;
      } catch (error) {
        console.error("Error fetching census data: ", error);
        return [];
      }
    });
    
    useEffect(() => {
      fetchCensusData();
    }, [fetchCensusData]);
    
  return (
    <>
      <title>Censado - Nómina</title>
      <div>
        <h1 className="text-lg md:text-2xl font-bold mb-4 ">Censado</h1>
      </div>
    </>
  );
}
