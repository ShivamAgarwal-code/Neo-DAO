using System;
using System.ComponentModel;
using System.Numerics;
using Neo;
using Neo.SmartContract;
using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Attributes;
using Neo.SmartContract.Framework.Native;
using Neo.SmartContract.Framework.Services;


#nullable enable

/**
    This file contains the ProposalRegistry object, 
    the object that manages the proposals for all
    DAOS.
*/

namespace AndroidTechnologies
{

    /// <summary>
    /// This class holds the details for a particular DAO.
    /// </summary>
    public class ProposalDetailsRegistry
    {
        // --------------------- CONSTANTS --------------------

        /// <summary>
        /// Constructor.
        /// </summary>
        public ProposalDetailsRegistry() 
        {
        }

        // ---------------------------- PROPERTIES ----------------------

        // -------------------------------- DATA MEMBERS --------------------

        // -------------------- BEGIN: STORAGE MAPS --------

        // >>>>> Proposal Details map.

        const string MAP_OF_PROPOSAL_DETAILS_REGISTRY = "PDR:";

        private static StorageMap MapOfProposalDetailsRegistry => new StorageMap(Storage.CurrentContext, MAP_OF_PROPOSAL_DETAILS_REGISTRY);

        /// <summary>
        /// Using a DAO details object and a valid proposal
        ///  details object, build a key that can be used with 
        ///  the proposal details registry.
        /// </summary>
        /// <param name="daoDetailsObj">A valid DAO details object.
        /// <param name="proposalId">A valid proposal details
        ///  ID.</param>
        /// 
        /// <returns>Returns a ByteString that can be used as a key
        ///  with the proposal details registry storage map.</returns>
        private static ByteString BuildProposalRegistryKey(DaoDetails daoDetailsObj, ByteString proposalId)
        {
            if (null == daoDetailsObj)
                throw new Exception($"({nameof(BuildProposalRegistryKey)}) The DAO details object is unassigned.");
            // The DAO details sequence of creation number should never be zero.
            if (0 >= daoDetailsObj.SequenceNumber)
                throw new Exception($"({nameof(BuildProposalRegistryKey)}) The DAO details object has an invalid sequence number.");

            if (MyUtilities.IsEmptyString(proposalId))
                throw new Exception($"({nameof(BuildProposalRegistryKey)}) The proposal details ID is empty.");

            var strDaoDetailsSeqNum = (ByteString)daoDetailsObj.SequenceNumber;
            var theKey = strDaoDetailsSeqNum + proposalId;

            return theKey;
        }

        /// <summary>
        /// Retrieve the proposal details object for a particular DAO.
        /// </summary>
        /// <param name="daoDetailsObj">The DAO details object 
        ///  that the proposal belongs to.
        /// <param name="proposalId">A valid proposal details ID.</param>
        /// 
        /// <returns>Returns the proposal details object with the
        ///  given ID that belongs to the specified DAO.  NULL,
        ///  if none exists with that ID.</returns>
        public static ProposalDetails GetProposalDetails(DaoDetails daoDetailsObj, ByteString proposalId)
        {
            var theMapKey = BuildProposalRegistryKey(daoDetailsObj, proposalId);
            return (ProposalDetails) MapOfProposalDetailsRegistry.GetObject(theMapKey);
        }

        /// <summary>
        /// Store a proposal details object for a particular DAO.
        /// </summary>
        /// <param name="daoDetailsObj">The DAO details object 
        ///  the operation is being performed for.
        /// <param name="proposalDetailsObj">A valid proposal details object.</param>
        public static void PutProposalDetails(DaoDetails daoDetailsObj, ProposalDetails proposalDetailsObj)
        {
            var theMapKey = BuildProposalRegistryKey(daoDetailsObj, proposalDetailsObj.ID);

            // proposalDetailsObj.Flags = null;

            MapOfProposalDetailsRegistry.PutObject(theMapKey, proposalDetailsObj);
        }

        /// <summary>
        /// Get all the proposals submitted to a particular DAO.
        /// </summary>
        /// <param name="daoDetailsObj">A valid DAO details object.</param>
        /// 
        /// <returns>Returns a list of all the proposals submitted
        ///  to the specified DAO.</reeturns.
        public static List<ProposalDetails> GetAllDaoProposals(DaoDetails daoDetailsObj)
        {
            if (null == daoDetailsObj)
                throw new Exception($"({nameof(GetAllDaoProposals)}) The DAO details object is unassigned.");

            var listProposalObjs = new List<ProposalDetails>();

            var iterator = MapOfProposalDetailsRegistry.Find(FindOptions.DeserializeValues);

            while (iterator.Next())
            {
                var keyValuePair = (object[])iterator.Value;
                var theKey = (ByteString)keyValuePair[0];
                var proposalDetailsObj = (ProposalDetails)keyValuePair[1];

                var theDetails = proposalDetailsObj.Details;

                // Runtime.Log($"The details: {theDetails}");

                listProposalObjs.Add(proposalDetailsObj);
            }

            return listProposalObjs;
        }

       // -------------------- END  : STORAGE MAP -> MapOfEscrowUTB --------        
    }
}