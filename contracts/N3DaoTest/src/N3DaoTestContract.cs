/**

NOTES: This smart contract is based on the HausDAO Molochv2.1 smart contracts from the
    Ethereum blockchain. (MIT license), converted to C# for the Neo N3
    blockchain.  Origiaal Github repository:

    https://github.com/HausDAO/Molochv2.1
*/

/*
NEXT - 

    Later: Add IsMembership proposal flag.  If set, "applicant" in SubmitProposal() must
        be a valid address.
    Re-enable CheckWitness in DoBasicCheckWitnessChecK().

*/

/**

    DEPLOYMENT NOTES 1:

        Deployed by: neo-go
        Target: Neo N3 TestNet (rc4)
        Contract Script Hash Received: 0e40ef47a7d833e4c8fead328d751577adfb588d
*/

using System;
using System.ComponentModel;
using System.Numerics;
using Neo;
using Neo.SmartContract;
using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Attributes;
using Neo.SmartContract.Framework.Native;
using Neo.SmartContract.Framework.Services;
// using ReentrancyGuard;

#nullable enable

namespace AndroidTechnologies
{

    // -------------------- HARD-CODED ADDRESSES FOR THE CONTRACT LEVEL "ACCOUNTS" ---------------

    [ManifestExtra("Author", "Robert Oschler")]
    // [ManifestExtra("Email", "doge@hypnocryptocurrency.com")]
    [ManifestExtra("Description", "Main smart contract for the NeoDao dApp.")]
    [DisplayName("N3DaoTestContract")]
    public class N3DaoTest : SmartContract
    {

        // Simple version number.
        public static int CURRENT_VERSION = 3;

        // -------------------- BEGIN: EVENT -> SummonComplete ------------
        public delegate void OnSummonCompleteDelegate(UInt160 summoner, UInt160[] tokens, BigInteger summoningTime, BigInteger periodDuration, BigInteger votingPeriodLength, BigInteger gracePeriodLength, BigInteger proposalDeposit, BigInteger dilutionBound, BigInteger processingReward);
        // Define a delegate for the event.

        [DisplayName("SummonComplete")]
        public static event OnSummonCompleteDelegate OnSummonComplete = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> SummonComplete ------------


        // -------------------- BEGIN: EVENT -> SubmitProposal ------------
        public delegate void OnSubmitProposalDelegate(UInt160 applicant, BigInteger sharesRequested, BigInteger lootRequested, BigInteger tributeOffered, UInt160 tributeToken, BigInteger paymentRequested, UInt160 paymentToken, string details, ProposalFlags flags, ByteString proposalId, UInt160 delegateKey, UInt160 memberAddress);
        // Define a delegate for the event.

        [DisplayName("SubmitProposal")]
        public static event OnSubmitProposalDelegate OnSubmitProposal = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> SubmitProposal ------------


        // -------------------- BEGIN: EVENT -> SponsorProposal ------------
        public delegate void OnSponsorProposalDelegate(UInt160 delegateKey, UInt160 memberAddress, BigInteger proposalId, BigInteger proposalIndex, BigInteger startingPeriod);
        // Define a delegate for the event.

        [DisplayName("SponsorProposal")]
        public static event OnSponsorProposalDelegate OnSponsorProposal = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> SponsorProposal ------------


        // -------------------- BEGIN: EVENT -> SubmitVote ------------
        public delegate void OnSubmitVoteDelegate(BigInteger proposalId, BigInteger proposalIndex, UInt160 delegateKey, UInt160 memberAddress, BigInteger uintVote);
        // Define a delegate for the event.

        [DisplayName("SubmitVote")]
        public static event OnSubmitVoteDelegate OnSubmitVote = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> SubmitVote ------------


        // -------------------- BEGIN: EVENT -> ProcessProposal ------------
        public delegate void OnProcessProposalDelegate(BigInteger proposalIndex, BigInteger proposalId, bool didPass);
        // Define a delegate for the event.

        [DisplayName("ProcessProposal")]
        public static event OnProcessProposalDelegate OnProcessProposal = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> ProcessProposal ------------


        // -------------------- BEGIN: EVENT -> ProcessWhitelistProposal ------------
        public delegate void OnProcessWhitelistProposalDelegate(BigInteger proposalIndex, BigInteger proposalId, bool didPass);
        // Define a delegate for the event.

        [DisplayName("ProcessWhitelistProposal")]
        public static event OnProcessWhitelistProposalDelegate OnProcessWhitelistProposal = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> ProcessWhitelistProposal ------------


        // -------------------- BEGIN: EVENT -> ProcessGuildKickProposal ------------
        public delegate void OnProcessGuildKickProposalDelegate(BigInteger proposalIndex, BigInteger proposalId, bool didPass);
        // Define a delegate for the event.

        [DisplayName("ProcessGuildKickProposal")]
        public static event OnProcessGuildKickProposalDelegate OnProcessGuildKickProposal = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> ProcessGuildKickProposal ------------


        // -------------------- BEGIN: EVENT -> Ragequit ------------
        public delegate void OnRagequitDelegate(UInt160 memberAddress, BigInteger sharesToBurn, BigInteger lootToBurn);
        // Define a delegate for the event.

        [DisplayName("Ragequit")]
        public static event OnRagequitDelegate OnRagequit = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> Ragequit ------------


        // -------------------- BEGIN: EVENT -> TokensCollected ------------
        public delegate void OnTokensCollectedDelegate(UInt160 token, BigInteger amountToCollect);
        // Define a delegate for the event.

        [DisplayName("TokensCollected")]
        public static event OnTokensCollectedDelegate OnTokensCollected = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> TokensCollected ------------


        // -------------------- BEGIN: EVENT -> CancelProposal ------------
        public delegate void OnCancelProposalDelegate(BigInteger proposalId, UInt160 applicantAddress);
        // Define a delegate for the event.

        [DisplayName("CancelProposal")]
        public static event OnCancelProposalDelegate OnCancelProposal = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> CancelProposal ------------


        // -------------------- BEGIN: EVENT -> UpdateDelegateKey ------------
        public delegate void OnUpdateDelegateKeyDelegate(UInt160 memberAddress, UInt160 newDelegateKey);
        // Define a delegate for the event.

        [DisplayName("UpdateDelegateKey")]
        public static event OnUpdateDelegateKeyDelegate OnUpdateDelegateKey = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> UpdateDelegateKey ------------


        // -------------------- BEGIN: EVENT -> Withdraw ------------
        public delegate void OnWithdrawDelegate(UInt160 memberAddress, UInt160 token, BigInteger amount);
        // Define a delegate for the event.

        [DisplayName("Withdraw")]
        public static event OnWithdrawDelegate OnWithdraw = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> Withdraw ------------

        // -------------------- BEGIN: EVENT -> NewDao ------------
        // public delegate void OnNewDaoDelegate(UInt160 memberAddress, ByteString ID, ByteString displayName);
        public delegate void OnNewDaoDelegate(UInt160 memberAddress, BigInteger ID, ByteString displayName);
        // Define a delegate for the event.

        [DisplayName("NewDao")]
        public static event OnNewDaoDelegate OnNewDao = default!;
        // Declare the event name and event.

        // -------------------- END  : EVENT -> NewDao ------------        

        // -------------------- BEGIN: STORAGE MAP -> MapOfDaoOwnersRegistry --------

        // This map allows us to look up the owner details for a DAO using the DAO GUID.

        [StorageGroup("DaoOwners", typeof(DaoOwnerXref))]
        [StorageKeySegment("daoGuid", StorageKeySegmentType.String)]
        const string MAP_OF_DAO_OWNERS = "DOWN";

        private static StorageMap MapOfDaoOwnersRegistry => new StorageMap(Storage.CurrentContext, MAP_OF_DAO_OWNERS);


        /// <summary>
        /// Retrieve the DAO owner details object using the DAO's GUID.
        /// </summary>
        /// <param name="daoGuid">The GUID of the desired DAO.</param>
        /// 
        /// <returns>Returns the DAO owner details object for the DAO whose GUID 
		///  was provided, or returns NULL if one is not found.</returns>
        private static DaoOwnerXref? GetDaoOwnerDetails(BigInteger daoGuid)
        {
            // Validate the parameters.
            if (BigInteger.Zero == daoGuid)
                throw new Exception($"({nameof(GetDaoOwnerDetails)}) The DAO GUID is empty.");

            var theDaoOwnerDetailsObj = (DaoOwnerXref)MapOfDaoOwnersRegistry.GetObject((ByteString)daoGuid);

            if (theDaoOwnerDetailsObj != null)
                // Found it.  Return the object found.
                return (DaoOwnerXref)theDaoOwnerDetailsObj;
            else
                // No Dao Owner Details object was found for the given key.
                //  Return NULL.
                return null;
        }

        /// <summary>
        /// Save the DAO owner details object for the DAO with the given GUID.
        /// </summary>
        /// <param name="daoGuid">The GUID of the DAO.</param>
		/// <param name="daoDetailsObj">The object with the new or updated
		///		DAO owner details.</param>
        private static void PutDaoOwnerDetails(ByteString daoGuid, DaoOwnerXref daoDetailsObj)
        {
            var errMsg = "(unknown)";

            // Validate the parameters.
            if ("" == daoGuid)
                throw new Exception($"({nameof(PutDaoOwnerDetails)}) The DAO GUID is empty.");

            if (daoDetailsObj == null)
            {
                errMsg = $"({nameof(PutDaoOwnerDetails)}) The DAO owner details object is unassigned.";
                Runtime.Log(errMsg);
                throw new Exception(errMsg);
            }

            // Store the DAO details object.
            MapOfDaoOwnersRegistry.PutObject(daoGuid, daoDetailsObj);
        }


        /// <summary>
        /// Add or create an object that ties the given owner address
        ///  to the GUID of a particular DAO.
        /// </summary>
        /// <param name="ownerAddress">The address of a user that owns the DAO</param>
        /// <param name="daoGuid">The GUID of the DAO</param>
        private static void UpdateOrCreateOwnerDetails(UInt160 ownerAddress, BigInteger daoGuid)
        {
            // Validate the parameters.
            if (MyUtilities.IsEmptyOrInvalidUInt160(ownerAddress))
                throw new Exception($"({nameof(UpdateOrCreateOwnerDetails)}) The owner address is empty.");
            if (BigInteger.Zero == daoGuid)
                throw new Exception($"({nameof(UpdateOrCreateOwnerDetails)}) The DAO GUID is zero.");

            var xrefObj = new DaoOwnerXref(ownerAddress, daoGuid);

            // Store the DAO details object.
            MapOfDaoOwnersRegistry.PutObject((ByteString)daoGuid, xrefObj);
        }

        // -------------------- END  : STORAGE MAP -> MapOfDaoOwnersRegistry --------

        // -------------------- BEGIN: STORAGE MAP -> MapOfDaos --------

        const string MAP_OF_DAO_DETAILS = "MODD";

        private static StorageMap MapOfDaoDetails => new StorageMap(Storage.CurrentContext, MAP_OF_DAO_DETAILS);

        /// <summary>
        /// Using a given owner address and a target DAO name,
        ///  build a key that can be used with storage map.
        /// </summary>
        /// <param name="ownerAddress">The address that created the
        ///     DAO (i.e. - the "owner")</param>
        /// <param name="daoGuid">The GUID that identifies the desired DAO.</param>
        /// 
        /// <returns>Returns a ByteString that can be used as a key
        ///  with a storage map.</returns>
        private static ByteString BuildDaoDetailsKey(UInt160 ownerAddress, BigInteger daoGuid)
        {
            var strOwnerAddress = (ByteString)ownerAddress;
            // var strHashDaoGuid = CryptoLib.Sha256(daoGuid);
            // var theKey = strOwnerAddress + strHashDaoGuid;
            var str = ownerAddress + ":" + (ByteString)daoGuid;
            var theKey = CryptoLib.Sha256(str);

            return theKey;
        }


        /// <summary>
        /// Validate the parameters used in many of our DAO related methods
        ///     using a common function.
        ///     
        /// NOTE: If an error occurs, an error message will be output to
        ///     the console.
        /// </summary>
        /// <param name="callerName">The name of the calling method.</param>
        /// <param name="ownerAddress">The address of the DAO owner.</param>
        /// <param name="daoGuid">The GUID that identifies the desired DAO.</param>
        /// 
        /// <returns>If the parameters validate, then an empty string
        ///     will be returned.  Otherwise an error message is returned.</returns>
        /// <exception cref="Exception"></exception>
        private static string ValidateDaoParameters(string callerName, UInt160 ownerAddress, BigInteger daoGuid)
        {
            var errMsg = "(ValidateDaoParameters::unknown)";

            if ("" == callerName)
                errMsg = $"({callerName}) The caller name is empty.";
            else if (MyUtilities.IsEmptyOrInvalidUInt160(ownerAddress))
                errMsg = $"({callerName}) The owner address is empty.";
            else if (BigInteger.Zero == daoGuid)
                errMsg = $"({callerName}) The DAO GUID is zero.";
            else
                // Parameters validated.
                errMsg = "";

            if ("" != errMsg)
                // Log the error message.
                Runtime.Log(errMsg);

            return errMsg;
        }

        /// <summary>
        /// Retrieve the details object for a Dao created by a 
        ///     particular owner.
        /// </summary>
        /// <param name="ownerAddress">The N3 address that created the
        ///     DAO (i.e. - the "owner")</param>
        /// <param name="daoGuid">The GUID that identifies the desired DAO.</param>
        /// 
        /// <returns>Returns a DaoDetails object for the given
        ///   owner and DAO name if one exists, or returns NULL if one is
        ///   not found with the given parameters.</returns>
        private static DaoDetails? GetDaoDetails(UInt160 ownerAddress, BigInteger daoGuid)
        {
            var errMsg = "(unknown)";

            // Validate the DAO parameters.
            errMsg = ValidateDaoParameters(nameof(GetDaoDetails), ownerAddress, daoGuid);
            if ("" != errMsg)
                throw new Exception(errMsg);

            var theDaoKey = BuildDaoDetailsKey(ownerAddress, daoGuid);
            var theDaoDetailsObj = MapOfDaoDetails.GetObject(theDaoKey);

            if (theDaoDetailsObj != null)
                // Found it.  Return the object found.
                return (DaoDetails)theDaoDetailsObj;
            else
                // No Dao Details object was found for the given key.
                //  Return NULL.
                return null;
        }

        /// <summary>
        /// Save the details object for a specific Dao created by a 
        ///     particular owner.
        ///     
        /// </summary>
        /// <param name="ownerAddress">The N3 address that created the
        ///     DAO (i.e. - the "owner")</param>
        /// <param name="daoGuid">The GUID that identifies the desired DAO.</param>
        /// <param name="daoDetailsObj">The DAO details object to
        ///     store.</param>
        private static void PutDaoDetails(UInt160 ownerAddress, BigInteger daoGuid, DaoDetails daoDetailsObj)
        {
            var errMsg = "(unknown)";
            // Validate the DAO parameters.
            errMsg = ValidateDaoParameters(nameof(PutDaoDetails), ownerAddress, daoGuid);
            if ("" != errMsg)
                throw new Exception(errMsg);

            var theDaoKey = BuildDaoDetailsKey(ownerAddress, daoGuid);

            if (daoDetailsObj == null)
            {
                errMsg = $"({nameof(PutDaoDetails)}) The DAO details object is unassigned.";
                Runtime.Log(errMsg);
                throw new Exception(errMsg);
            }

            // Store the DAO details object.
            MapOfDaoDetails.PutObject(theDaoKey, daoDetailsObj);
        }

        // -------------------- END  : STORAGE MAP -> MapOfDaos --------

        // -------------------- BGIN : STORAGE MAP -> Contract Level Variables --------


        // This block emulates contract level variables (e.g. - meta-data) by using
        //  a StorageMap and a set of dedicated storage map keys, one for each
        //  "variable".
        const string CLV_CONTRACT_OWNER = "CONTRACT_OWNER";

        private static StorageMap MapOfContractLevelVariables => new StorageMap(Storage.CurrentContext, MAP_OF_DAO_DETAILS);

        // WARNING!: This variable is the total number of DAOs created
        //  for all time for this smart contract!  It must incremented
        //  each time a new DAO is created and it must NEVER be 
        //  altered, since it is used as a key segment in the
        //  user token balance maps!
        const string VAR_NAME_NUM_DAOS_CREATED = "NUM_DAOS_CREATED:";

        /// <summary>
        /// Get the total number of DAOs ever created with this smart
        ///  contract.
        /// </summary>
        /// <returns>Returns the total number of DAOs ever created with this smart
        ///  contract.</returns>
        private static BigInteger GetNumberOfDaosCreated()
        {
            var res = MapOfContractLevelVariables.Get(VAR_NAME_NUM_DAOS_CREATED);

            if (null == res)
                return 0;
            else
                return (BigInteger)res;
        }

        /// <summary>
        /// Increment the total number of DAOs ever created with this smart
        ///  contract.
        /// </summary>
        /// <returns>Returns incremented total number of DAOs ever created with this smart
        ///  contract.</returns>
        private static BigInteger IncrementNumberOfDaosCreated()
        {
            var newNumberOfDaosCreated = (BigInteger)0;

            // Get the current value.
            var numDaosCreated = GetNumberOfDaosCreated();

            if (numDaosCreated < 0)
                throw new Exception($"({nameof(IncrementNumberOfDaosCreated)})The number of DAOs created is negative.");

            newNumberOfDaosCreated = numDaosCreated + 1;

            MapOfContractLevelVariables.Put(VAR_NAME_NUM_DAOS_CREATED, (ByteString)newNumberOfDaosCreated);

            return newNumberOfDaosCreated;
        }

        // -------------------- END  : STORAGE MAP -> Contract Level Variables --------

        // -------------------- BEGIN: PAYMENT METHOD -> onNEP17Payment --------

        /// <summary>
        /// This method is called by the GasToken contract after 
        ///  a TOKEN transfer (payment) has been made successfullyc.
        ///  
        /// NOTE: The custom data object array the client passes
        ///  must match the PARAMETER format expected by this
        ///  call and the calls it makes internally.
        /// </summary>
        /// <param name="paymentFrom">The sender of the transaction, which
        ///  is the user making the payment.</param>
        /// <param name="amount">The amount paid.</param>
        /// <param name="data">Any custom data that was included
        ///  with the transfer/payment.</param>
        public static void onNEP17Payment(UInt160 fromAddress, BigInteger amount, object[] data)
        {
            string theAmountOfLastPayment = StdLib.Itoa(amount);
            var errMsg = "(unknown)";

            // Route the call to the correct method.
            string targetMethod = (string)data[0];
            var callResult = (BigInteger)0;

            if ("" == targetMethod)
            {
                errMsg = $"({nameof(onNEP17Payment)}) The target method parameter is empty.";
                Runtime.Log(errMsg);
                throw new Exception(errMsg);
            }
            else if ("createDao" == targetMethod)
            {
                CreateDao(fromAddress, amount, data);
            }
            else if ("submitProposal" == targetMethod)
            {
                SubmitProposal(fromAddress, amount, data);
            }
            else
            {
                errMsg = $"({nameof(onNEP17Payment)}) Unknown method name: {targetMethod}.";
                Runtime.Log(errMsg);
                throw new Exception(errMsg);
            }
        }

        // -------------------- END  : PAYMENT METHOD -> onNEP17Payment --------

        // -------------------- BEGIN: SMART CONTRACT -> N3DaoTest --------

        /// <summary>
        /// Constructor
        /// </summary>
        public N3DaoTest()
        {

        }

        /// <summary>
        /// Protects against reentrant calls to the smart contract.
        ///   TODO: Not implemented yet.  
        /// </summary>
        private static void nonReentrant()
        {
            Runtime.Log($"The reentrancy guard function is not implemented yet.");
        }

        /// <summary>
        /// Looks up a DAO details object by its GUID.
        ///  If found the object is returned.  If not,
        ///  an exception is thrown.
        /// </summary>
        /// <returns>Returns the DAO details object represented
        ///  by the given GUID, if one exists.  Throws an
        ///  exception if one can not be found.
        [Safe]
        private static DaoDetails GetDaoDetailsByGuidOrDie(BigInteger daoGuid)
        {
            if (BigInteger.Zero == daoGuid)
                throw new Exception($"({nameof(GetDaoDetailsByGuidOrDie)})The DAO GUID is zero.");

            // Look up the DAO owner address using the DAO GUID.
            var ownerDetailsObj = GetDaoOwnerDetails(daoGuid);

            if (ownerDetailsObj == null)
                throw new Exception($"({nameof(GetDaoDetailsByGuidOrDie)})Unable to find an owner details object for the given GUID.");

            var daoDetailsObj = GetDaoDetails(ownerDetailsObj.ownerAddress, ownerDetailsObj.IdOfDao);

            if (daoDetailsObj == null)
                throw new Exception($"({nameof(GetDaoDetailsByGuidOrDie)})Unable to find a DAO details object using the given GUID.");

            return daoDetailsObj;
        }

        /// <summary>
        /// Returns a summary of the DAO whose GUID is specified.
        /// </summary>
        /// <param name="daoGuid">The GUID of the desired DAO.</param>
        /// <returns>Returns a list with one summary object containing some of the
        ///  details of the desird DAO.  We return a list of one element
        ///  to make client side decoding more uniform.</returns>
        [Safe]
        public static List<DaoSummary> GetDaoSummaryByGuid(BigInteger daoGuid)
        {
            if (BigInteger.Zero == daoGuid)
                throw new Exception($"({nameof(GetDaoSummaryByGuid)})The DAO GUID is zero.  Please provide a valid DAO ID");

            var daoDetailsObj = GetDaoDetailsByGuidOrDie(daoGuid);

            if (daoDetailsObj == null)
                throw new Exception($"({nameof(GetDaoSummaryByGuid)})The DAO lookup operation failed.");

            // Make a summary object and return it.  
            var daoSummaryObj = new DaoSummary(daoDetailsObj);

            var listOfOneDaoSummary = new List<DaoSummary>();
            listOfOneDaoSummary.Add(daoSummaryObj);

            return listOfOneDaoSummary;
        }

        /// <summary>
        /// Create a new DAO.
        /// </summary>
        /// <param name="fromAddress">The sender of the transaction</param>
        /// <param name="amount">The amount sent with the transaction</param>
        /// <param name="data">The custom data object that contaisn the
        ///  DAO parameters (i.e. - the settings for the new DAO)</param>
        /// <returns>Returns the ID of the newly created DAO.
        public static BigInteger CreateDao(UInt160 fromAddress, BigInteger amount, object[] data)
        {
            var daoDetailsObj = new DaoDetails();
            var errMsg = "(unknown)";


            // Create a payment security context object.
            var paymentSecurityContextObj = new PaymentSecurityContext();

            // Authenticate the sender and permissions of the sender.
            paymentSecurityContextObj.CheckSender(nameof(CreateDao));

            // We should have exactly 2 elements in the custom data object array.
            if (data.Length != 2)
                throw new Exception($"({nameof(CreateDao)}) Expected 2 elements in the custom data object parameter.  Found: {data.Length.ToString()}");

            // Deserialize the actual custom data parameters from the
            //  serialized JSON object in the second slot of the custom
            //  data object.
            var strJson = (string)data[1];
            var jsonCustomDataParamsObj = (Map<string, object>)StdLib.JsonDeserialize(strJson);

            // NOTE: For now, we use the transaction sender as the summoner 
            //  and the only summoner.  We ignore the values sent by the
            //  caller.  However, we leave this code here for when we do
            //  allow multipler summmoners.
            /*
            if (_summoner.Length < 1)
                throw new Exception($"({nameof(CreateDao)}) The _summoner array is empty");

            var _summonerIgnored = (UInt160[])jsonCustomDataParamsObj["array_summoner_addresses"];
            */

            // TODO:  Only accepting NEO and GAS tokens for the Polaris hackathon.
            //  NEO FOR "shares', GAS for "loot".  After the hackathon,
            //  add full, flexible support for multiple tokens. Currently
            //  the the incoming _approvedTokens array is ignored. 
            // var _approvedTokens = (ByteString[])data[ndx++];
            var _summoner = new UInt160[1];
            _summoner[0] = fromAddress;

            var _approvedTokens = new UInt160[2];

            _approvedTokens[0] = GAS.Hash;
            _approvedTokens[1] = NEO.Hash;

            if (_approvedTokens.Length < 1)
                throw new Exception($"({nameof(CreateDao)}) The _approvedTokens array is empty");

            // IMPORTANT!: Increment the DAO creation sequence number.  Note, since
            //  this function increments the DAO sequence number BEFORE it returns
            //  the value, thus returning the INCREMENTED value and not the original
            //  value, we should never have a DAO with a sequence number of zero.
            //  That is, the very first actual sequence number assigned to a DAO
            //  will be 1, not 0. This allows us to detect an unitialized or
            //  improperly initialized DAO object by checking to see if its
            //  sequence number is 0.s
            daoDetailsObj.SequenceNumber = IncrementNumberOfDaosCreated();

            // The token used for deposits is assumed to be in the first slot of the approved tokens array.
            daoDetailsObj.DepositToken = _approvedTokens[0];

            daoDetailsObj.DilutionBound = (BigInteger)jsonCustomDataParamsObj["dilution_bound"];
            daoDetailsObj.DisplayName = (ByteString)jsonCustomDataParamsObj["display_name"];
            daoDetailsObj.GracePeriodLength = (BigInteger)jsonCustomDataParamsObj["grace_period_length"];
            // daoDetailsObj.SequenceNumber = (ByteString)jsonCustomDataParamsObj["dao_guid"];

            // Use the sequence number as the ID.
            // daoDetailsObj.SequenceNumber = daoDetailsObj.SequenceNumber;

            daoDetailsObj.MembershipFee = (BigInteger)jsonCustomDataParamsObj["membership_fee"];
            daoDetailsObj.MinSummonerShares = (BigInteger)jsonCustomDataParamsObj["minimum_summoner_shares"];
            daoDetailsObj.PeriodDuration = (BigInteger)jsonCustomDataParamsObj["period_duration"];
            daoDetailsObj.ProcessingReward = (BigInteger)jsonCustomDataParamsObj["processing_reward"];
            daoDetailsObj.ProposalDeposit = (BigInteger)jsonCustomDataParamsObj["proposal_deposit"];

            daoDetailsObj.SummoningTime = (BigInteger)jsonCustomDataParamsObj["summoning_time"];

            var _summonerShares = (BigInteger[])jsonCustomDataParamsObj["array_summoner_shares"];

            daoDetailsObj.VotingPeriodLength = (BigInteger)jsonCustomDataParamsObj["voting_period_length"];

            // daoDetailsObj.SummoningTime = (BigInteger)data[ndx++];
            // daoDetailsObj.VotingPeriodLength = (BigInteger)data[ndx++];

            // For now, the transaction sender is the DAO owner.
            daoDetailsObj.OwnerAddress = fromAddress;

            if (MyUtilities.IsEmptyOrInvalidUInt160(fromAddress))
                throw new Exception($"({nameof(CreateDao)}) The fromAddress is invalid.");

            // Call the object's initialization function.
            daoDetailsObj.init(_summoner, _summonerShares, _approvedTokens);

            if (true)
            {
                var fldDepositToken = daoDetailsObj.DepositToken;

                var fldDilutionBound = daoDetailsObj.DilutionBound;
                var fldDisplayName = daoDetailsObj.DisplayName;
                // var fldPeriodDuration = daoDetailsObj.PeriodDuration;
                var fldGracePeriodLength = daoDetailsObj.GracePeriodLength;
                // var fldID = daoDetailsObj.SequenceNumber;
                var fldMembershipFee = daoDetailsObj.MembershipFee;
                var fldMinSummonerShares = daoDetailsObj.MinSummonerShares;
                var fldPeriodDuration = daoDetailsObj.PeriodDuration;
                var fldProcessingReward = daoDetailsObj.ProcessingReward;
                var fldProposalDeposit = daoDetailsObj.ProposalDeposit;

                var fldSummoningTime = daoDetailsObj.SummoningTime;
                var fldVotingPeriodLength = daoDetailsObj.VotingPeriodLength;

                // For now, the transaction sender is the DAO owner.
                var fldOwnerAddress = daoDetailsObj.OwnerAddress;
            }

            // Validate the paramters by validating the object created for the DAO.
            daoDetailsObj.ValidateOrDie(nameof(CreateDao));

            // Make sure a DAO with the same owner and ID has not been created already.
            // var testForDupsObj = GetDaoDetails(fromAddress, daoDetailsObj.SequenceNumber);
            var testForDupsObj = GetDaoDetails(fromAddress, daoDetailsObj.SequenceNumber);

            if (testForDupsObj != null)
            {
                // Duplicate DAO.
                // errMsg = $"({nameof(CreateDao)}) A DAO with ID({testForDupsObj.ID}) already exists.";
                errMsg = $"({nameof(CreateDao)}) A DAO with ID({testForDupsObj.SequenceNumber}) already exists.";
                Runtime.Log(errMsg);
                throw new Exception(errMsg);
            }

            // Add the new DAO.
            PutDaoDetails(daoDetailsObj.OwnerAddress, daoDetailsObj.SequenceNumber, daoDetailsObj);

            // Add/create an XREF object that ties the owner address to the new DAO.
            UpdateOrCreateOwnerDetails(daoDetailsObj.OwnerAddress, daoDetailsObj.SequenceNumber);

            // Emit an event announcing the creation of this new DAO.
            OnNewDao(daoDetailsObj.OwnerAddress, daoDetailsObj.SequenceNumber, daoDetailsObj.DisplayName);

            Runtime.Log($"Created new DAO with ID: {daoDetailsObj.SequenceNumber}");

            return daoDetailsObj.SequenceNumber;
        }

        /// <summary>
        /// This method is for testing purposes only.
        /// </summary>
        /// <returns>Returns a simple message.</returns>
        [Safe]
        public static ByteString SafeMethodWithNoParameters()
        {
            var statusMsg = "Hello from SafeMethodWithNoParameters.";
            Runtime.Log(statusMsg);
            return statusMsg;
        }

        /// <summary>
        /// This function returns a list of all the DAOs registered with
        ///  this contract.
        /// </summary>
        /// <returns>Returns a list of DaoDetails objects.</returns>
        [Safe]
        public static List<DaoSummary> ListAllDaos()
        // public static ByteString ListAllDaos(ByteString Msg)
        {

            // var testMsg = (ByteString)"Hello from ListAllDaos";
            // return testMsg;

            /*
            var iteratorCheck = MapOfContractLevelVariables.Find(FindOptions.DeserializeValues);
            var res = iteratorCheck.Next();
            var kvp1 = (object)iteratorCheck.Value; // Error occurs here.
            var daoObj = (DaoSummary)kvp1;
            // var theKey1 = (DaoSummary)kvp1;
            // var theValue1 = kvp1;

            var iterator = MapOfDaoDetails.Find(FindOptions.DeserializeValues);
            */

            List<DaoSummary> listOfDaoSummaries = new();

            var numDaosCreated = GetNumberOfDaosCreated();

            if (0 >= numDaosCreated)
            {
                // No DAOs created yet.
            } 
            else 
            {
                for (var ndx = 1; ndx <= numDaosCreated; ndx++)
                {
                    var daoGuid = (BigInteger)ndx;

                    var daoDetailsObj = GetDaoDetailsByGuidOrDie(daoGuid);

                    if (null == daoDetailsObj)
                        break;

                    var daoSummaryObj = new DaoSummary(daoDetailsObj);

                    listOfDaoSummaries.Add(daoSummaryObj);
                }
            }

            return listOfDaoSummaries;

            /*
            // Iteratars aren't working for us.
            var iterator = MapOfDaoDetails.Find(FindOptions.ValuesOnly);

            while (iterator.Next())
            {
                if (iterator.Value == null)
                    break;

                var theValue = iterator.Value;
                var theValueBS = (ByteString)theValue;
                var theDaoDetailsObj = (DaoDetails)StdLib.Deserialize((ByteString)theValueBS);

                var theGuid = theDaoDetailsObj.SequenceNumber;

                var keyValuePair = (object[])iterator.Value; // Error occurs here.
                var theKey = (ByteString)keyValuePair[0];
                var daoDetailsObj = (DaoDetails)keyValuePair[1];

                var daoSummaryObj = new DaoSummary(daoDetailsObj);

                listOfDaoSummaries.Add(daoSummaryObj);
            }
            */
        }

        /// <summary>
        /// Looks up a proposal details object by its GUID.
        ///  If found the object is returned.  If not,
        ///  an exception is thrown.
        /// </summary>
        /// <param name="daoGuid">The GUID ID for the DAO the proposal
        ///  belongs to.</param>
        /// <param name="proposalGuid">The GUID for the
        ///  desired proposal.</param>
        ///  
        /// <returns>Returns the proposal details object that
        ///  bears the given proposal GUID, that belongs to 
        ///  the DAO associated with the given DAO GUID, 
        ///  if one exists.  Throws an exception if one can 
        ///  not be  found.  The proposal details object
        ///  is returned as serialized JSON object in 
        ///  string format.
        /*
        [Safe]
        public static ByteString GetProposalDetails(ByteString daoGuid, ByteString proposalGuid)
        {
            if (MyUtilities.IsEmptyString(daoGuid))
                throw new Exception($"({nameof(GetProposalDetails)})The DAO GUID is empty.");
            if (MyUtilities.IsEmptyString(proposalGuid))
                throw new Exception($"({nameof(GetProposalDetails)})The proposal GUID is empty.");

            // Look up the DAO details object.
            var daoDetailsObj = GetDaoDetailsByGuidOrDie(daoGuid);

            // Look up the proposal owner address using the proposal GUID.
            var proposalDetailsObj = daoDetailsObj.GetProposalDetails(proposalGuid);

            // if (proposalDetailsObj == null)
            //    throw new Exception($"({nameof(GetProposalDetails)})Unable to find a proposal details object for the given GUID.");

            var strJson = StdLib.JsonSerialize(proposalDetailsObj);

            return strJson;
        }
        */

        /// <summary>
        /// Returns a proposal summary object for the given DAO and proposal
        ///  ID pair.
        /// </summary>
        /// <param name="daoGuid">The GUID of the DAO the desired proposal
        ///  belongs to. </param>
        /// <param name="proposalGuid">The GUID of the desired proposal.
        ///  
        /// <returns>Returns a proposal summary object if a proposal was
        ///  found for the specified DAO, using the given proposal GUID.
        ///  Otherwise an error is thrown.  We return a list of one element
        ///  to make client side decoding more uniform.</returns></returns>
        [Safe]
        public static List<ProposalSummary> GetProposalSummary(BigInteger daoGuid, ByteString proposalGuid)
        {
            if (BigInteger.Zero == daoGuid)
                throw new Exception($"({nameof(GetProposalSummary)})The DAO GUID is zero.");
            if (MyUtilities.IsEmptyString(proposalGuid))
                throw new Exception($"({nameof(GetProposalSummary)})The proposal GUID is empty.");

            // Look up the DAO details object.
            var daoDetailsObj = GetDaoDetailsByGuidOrDie(daoGuid);

            // Get the proposal details object.
            var proposalDetailsObj = daoDetailsObj.GetProposalDetails(proposalGuid);

            if (null == proposalDetailsObj)
                throw new Exception($"({nameof(GetProposalSummary)})Invalid proposal ID.  Not found.");

            var listOfOneProposalSummaryObj = new List<ProposalSummary>();
            var proposalSummaryObj = new ProposalSummary(proposalDetailsObj);

            listOfOneProposalSummaryObj.Add(proposalSummaryObj);

            return listOfOneProposalSummaryObj;
        }        

        /// <summary>
        /// Return an array of all the proposals that belong to a given DAO.
        /// </summary>
        /// <param name="daoGuid">The GUID of the DAO whose proposals
        ///  are desired</param>
        ///  
        /// <returns>Returns an array of proposal summaries for the proposals
        ///   that belong to the the specified DAOs.</returns>
        [Safe]
        public static List<ProposalSummary> ListAllProposalsForDao(BigInteger daoGuid)
        {
            if (BigInteger.Zero == daoGuid)
                throw new Exception($"({nameof(ListAllProposalsForDao)})The DAO GUID is empty.");

            // Look up the DAO details object.
            var daoDetailsObj = GetDaoDetailsByGuidOrDie(daoGuid);

            // Get all proposals that belong to the DAO.
            var listProposalDetailsObjs = daoDetailsObj.GetAllProposals();

            var listProposalSummaryObjs = new List<ProposalSummary>();

            foreach (var proposalDetailsObj in listProposalDetailsObjs)
            {
                var proposalSummaryObj = new ProposalSummary(proposalDetailsObj);

                // Runtime.Log($"Proposal summary, details field: {proposalSummaryObj.Details}");

                listProposalSummaryObjs.Add(proposalSummaryObj);
            }

            return listProposalSummaryObjs;
        }


        /// <summary>
        /// Show one pseudo-address in the console window.
        /// 
        /// NOTE: Use the following syntaxt to convert a hex string
        ///  to type integer for the srcVal parameter, if that is the
        ///  format your source value is in.  For example:
        ///  
        ///     unchecked((int)0xdead)
        ///     
        /// </summary>
        /// <param name="srcLabel">A short string that describes the source value</param>
        /// <param name="srcVal">The source value to show as UInt160 value</param>
        private static void showOnePseudoAddress(string srcLabel, int srcVal)
        {
            if (MyUtilities.IsEmptyString(srcLabel))
                throw new Exception($"({nameof(showOnePseudoAddress)}) The srcLabel parameter is empty.");
            if (srcVal < 0)
                throw new Exception($"({nameof(showOnePseudoAddress)}) The srcVal parameter is negative.");

            // Use CryptoLib.ripemd160() to hash the constant values
            //  into a valid UInt160 values.
            var srcStr = $"{srcVal}";
            var uint160Value = (UInt160)CryptoLib.ripemd160(srcStr);
            // Need to pass the "Address Version" value to the ToAddress() 
            //  function.  For N3 MainNet and TestNet, that value is
            //  53.
            var str = uint160Value.ToAddress(53);
            Runtime.Log($"{srcLabel} address: {str}");
        }

        /// <summary>
        /// This method is a one-time operation so we can generate
        ///  UInt160 constants for the pseudo-addresses used for
        ///  various non-user accounts in this contract.
        /// </summary>
        public static void ShowPseudoAddresses()
        {
            /*
                Original Solidity code:

                address public constant GUILD = address(0xdead);
                address public constant ESCROW = address(0xbeef);
                address public constant TOTAL = address(0xbabe);

            */

            var srcVal = unchecked((int)0xdead);
            showOnePseudoAddress("GUILD", srcVal);

            srcVal = unchecked((int)0xbeef);
            showOnePseudoAddress("ESCROW", srcVal);

            srcVal = unchecked((int)0xbabe);
            showOnePseudoAddress("TOTAL", srcVal);
        }

        /// <summary>
        /// A valid DAO details object.
        /// </summary>
        /// <param name="paymentSecurityContextObj"></param>
        /// <param name="daoDetailsObj"></param>
        /// <param name="proposalGuid"></param>
        /// <param name="applicant"></param>
        /// <param name="sharesRequested"></param>
        /// <param name="lootRequested"></param>
        /// <param name="tributeOffered"></param>
        /// <param name="tributeToken"></param>
        /// <param name="paymentRequested"></param>
        /// <param name="paymentToken"></param>
        /// <param name="details"></param>
        /// <param name="flags"></param>
        /// <param name="strNeoFsCompoundIds"></param>
        /// <exception cref="Exception"></exception>
    private static ProposalDetails doSubmitProposal(
            PaymentSecurityContext paymentSecurityContextObj,
            DaoDetails daoDetailsObj,
            ByteString proposalGuid,
            UInt160 applicant,
            BigInteger sharesRequested,
            BigInteger lootRequested,
            BigInteger tributeOffered,
            UInt160 tributeToken,
            BigInteger paymentRequested,
            UInt160 paymentToken,
            ByteString details,
            ProposalFlags flags,
            ByteString strNeoFsCompoundIds)
        {
            if (null == paymentSecurityContextObj)
                throw new Exception($"({nameof(doSubmitProposal)}) The paymentSecurityContextObj is unassigned.");
            if (null == daoDetailsObj)
                throw new Exception($"({nameof(doSubmitProposal)}) The daoDetailsObj is unassigned.");
            if (MyUtilities.IsEmptyString(proposalGuid))
                throw new Exception($"({nameof(doSubmitProposal)}) The proposal GUID is empty.");

            var proposalDetailsObj = new ProposalDetails();

            proposalDetailsObj.ID = proposalGuid;
            proposalDetailsObj.Applicant = applicant;
            proposalDetailsObj.Proposer = paymentSecurityContextObj.Sender;
            proposalDetailsObj.Sponsor = UInt160.Zero;
            proposalDetailsObj.SharesRequested = sharesRequested;
            proposalDetailsObj.LootRequested = lootRequested;
            proposalDetailsObj.TributeOffered = tributeOffered;
            proposalDetailsObj.TributeToken = tributeToken;
            proposalDetailsObj.PaymentRequested = paymentRequested;
            proposalDetailsObj.PaymentToken = paymentToken;
            proposalDetailsObj.StartingPeriod = 0;
            proposalDetailsObj.YesVotes = 0;
            proposalDetailsObj.NoVotes = 0;
            proposalDetailsObj.Flags = flags;
            proposalDetailsObj.Details = details;
            proposalDetailsObj.MaxTotalSharesAndLootAtYesVote = 0;

            /*
            foreach (var jsonStrNeoFs in strNeoFsCompoundIds) {
                // Deserialize the NeoFS asset location details strings.
                var jsonNeoFsAssetObj = (Map<string, object>)StdLib.JsonDeserialize(jsonStrNeoFs);

                var neoFsUrlObj = new AssetLocationNeoFS(
                    (ByteString)jsonNeoFsAssetObj["container_id"], 
                    (ByteString)jsonNeoFsAssetObj["object_id"]);
                proposalDetailsObj.AssetsList.Add(neoFsUrlObj);
            }
            */
            proposalDetailsObj.NeoFsCompoundIdPairs = strNeoFsCompoundIds;

            // Submission time is now.
            proposalDetailsObj.SubmissionTime = MyUtilities.GetReferenceDateTime();

            // Validate the proposal content.
            proposalDetailsObj.ValidateOrDie(nameof(doSubmitProposal));

            // Add the proposal to the DAO.
            daoDetailsObj.PutProposalDetails(proposalDetailsObj);
            // ProposalDetailsRegistry.PutProposalDetails(daoDetailsObj, proposalDetailsObj);

            // ROS: No verification required on memberAddress being non-empty?
            UInt160 memberAddress = daoDetailsObj.MemberAddressByDelegateKey[paymentSecurityContextObj.Sender];

            // Emit an event regarding the newly submitted proposal.
            OnSubmitProposal(applicant, sharesRequested, lootRequested, tributeOffered, tributeToken, paymentRequested, paymentToken, details, flags, proposalDetailsObj.ID, paymentSecurityContextObj.Sender, memberAddress);

            // Return the new proposal object.
            return proposalDetailsObj;
        }        

        /// <summary>
        /// Submit a proposal.
        /// </summary>
        /// <param name="daoGuid">The ID of the target DAO.</param>
        /// <param name="proposalGuid">The ID of the new proposal.</param>
        /// <param name="applicant">The applicant, if this is a membership proposal.</param>
        /// <param name="sharesRequested">The number of "shares" tokens requested by the proposal.</param>
        /// <param name="lootRequested">The number of "loot" tokens requested by the proposal.</param>
        /// <param name="tributeOffered">The number of tribute tokens offered by the proposal.</param>
        /// <param name="tributeToken">The token type for the tribute token (contract hash).</param>
        /// <param name="paymentRequested">The number of payment tokens requested by the proposal.
        /// 
        /// NOTE: The reason the paymentRequested parameter exists is specifically for paying
        ///  non-members, since non-members don't participate in the DAO "shares" and "loot".
        /// </param>
        /// <param name="paymentToken">The token type for the payment (contract hash).</param>
        /// <param name="details">A short description of the proposal.</param>
        /// <param name="aryAssetUrls">An array of asset URLs that comprise the set
        ///  of assets associted with this proposal.</param>s
        ///  
        /// <returns>Returns the ID of the new proposal details object created.</returns>
        public static ByteString  SubmitProposal(UInt160 fromAddress, BigInteger amount, object[] data)        
        {
            nonReentrant();

            // Create a payment security context object.
            var paymentSecurityContextObj = new PaymentSecurityContext();

            // Authenticate the sender and permissions of the sender.
            paymentSecurityContextObj.CheckSender(nameof(SubmitProposal));

            // Deserialize the actual custom data parameters from the
            //  serialized JSON object in the second slot of the custom
            //  data object.
            var strJson = (string)data[1];
            var jsonCustomDataParamsObj = (Map<string, object>)StdLib.JsonDeserialize(strJson);

            var daoGuid = (BigInteger) jsonCustomDataParamsObj["dao_guid"];
            var proposalGuid = (ByteString) jsonCustomDataParamsObj["proposal_guid"];
            var applicant = (UInt160) jsonCustomDataParamsObj["applicant"];
            var sharesRequested = (BigInteger) jsonCustomDataParamsObj["shares_requested"];
            var lootRequested = (BigInteger) jsonCustomDataParamsObj["loot_requested"];
            var tributeOffered = (BigInteger) jsonCustomDataParamsObj["tribute_offered"];
            var tributeToken = (UInt160)jsonCustomDataParamsObj["tribute_token"];
            var paymentRequested = (BigInteger) jsonCustomDataParamsObj["payment_requested"];
            var paymentToken = (UInt160)jsonCustomDataParamsObj["payment_token"];
            var details = (ByteString) jsonCustomDataParamsObj["details"];
            // The NeoFS assets are passed as a comma delimited string of
            //  <container ID>:<object ID> pairs.
            var strNeoFsIdPairs = (ByteString) jsonCustomDataParamsObj["neofs_compound_id_pairs"];

            // TODO:  Only accepting NEO and GAS tokens for the Polaris hackathon.
            //  NEO FOR "shares', GAS for "loot".  After the hackathon,
            //  add full, flexible support for multiple tokens. Currently
            //  the the incoming _approvedTokens array is ignored. 

            // Override tokens specified with ones allowed for the hackathon.
            tributeToken = GAS.Hash;
            paymentToken = GAS.Hash;

            if (BigInteger.Zero == daoGuid)
                throw new Exception($"({nameof(SubmitProposal)}) The daoGuid is zero");

            // Validate the DAO GUID by getting the DAO details object for it.
            var daoDetailsObj = GetDaoDetailsByGuidOrDie(daoGuid);

            if (MyUtilities.IsEmptyString(proposalGuid))
                throw new Exception($"({nameof(SubmitProposal)}) The proposalGUID is missing");

            // Make sure this is not a duplicate proposal (based on its ID).
            var testDuplicateProposalObj = daoDetailsObj.GetProposalDetails(proposalGuid);

            if (null != testDuplicateProposalObj)
                throw new Exception($"({nameof(SubmitProposal)}) A proposal with the given GUID already exists for this DAO.");

            if (!(sharesRequested + lootRequested <= DaoDetails.MAX_NUMBER_OF_SHARES_AND_LOOT))
                throw new Exception($"({nameof(SubmitProposal)}) Too much shares and loot request");

            if (0 > tributeOffered)
                throw new Exception($"({nameof(SubmitProposal)}) The tributeOffered is negative");

            if (!daoDetailsObj.TokenWhiteList.HasKey(tributeToken))
                throw new Exception($"({nameof(SubmitProposal)}) The tributeToken is not whitelisted");

            // if (!(daoDetailsObj.TokenWhiteList[tributeToken]))
            //    throw new Exception($"({nameof(SubmitProposal)}) The tributeToken is not whitelisted");

            if (0 > paymentRequested)
                throw new Exception($"({nameof(SubmitProposal)}) The paymentRequested is negative");

            if (!(daoDetailsObj.TokenWhiteList[paymentToken]))
                throw new Exception($"({nameof(SubmitProposal)}) The payment token is not whitelisted");

            // Applicant field may be empty if this is not a membershp proposal.
            // if (MyUtilities.IsEmptyOrInvalidUInt160(applicant))
            //    throw new Exception($"({nameof(SubmitProposal)}) The applicant address is empty.");

            // If this is a membership application.  Make sure the applicant has not
            //  been jailed.
            if (!MyUtilities.IsEmptyOrInvalidUInt160(applicant))
            {
                // We have an applicant address.  Make sure it's not
                //  a reserved or address or a jailed member.
                if (UserTokenBalances.IsAddressReserved(applicant))
                    throw new Exception($"({nameof(SubmitProposal)}) The applicant address is a reserved address");
                if (daoDetailsObj.IsMemberAndJailed(applicant))
                    throw new Exception($"({nameof(SubmitProposal)}) The applicant has been jailed");
            }

            // Check to see if the GUILD can accept any more tribute
            //  token types, if a tribute has been offered.
            if (tributeOffered > 0)
            {
                // If the GUILD already accepts this kind of token, then
                //  implicitly we don't need to do the max token types
                //  check.
                var guildBalanceOfTributeToken =
                    daoDetailsObj.GetUserTokenBalance(
                        UserTokenBalances.GUILD_ACCOUNT_ADDRESS,
                        tributeToken);

                if (0 == guildBalanceOfTributeToken)
                {
                    // The GUILD has never acceptded a token of this type before.
                    //  Check to see if the GUILD is at its limit for accepting
                    //  new token types..
                    if (daoDetailsObj.TotalGuildBankTokens > DaoDetails.MAX_TOKEN_GUILDBANK_COUNT)
                        throw new Exception($"({nameof(SubmitProposal)}) 'The GUILD bank can not accept any new token types at this time.'");
                }
            }

            // Did we receive a tribute payment?
            if (tributeOffered > 0)
            {
                // TODO: After the Polaris hackathon, when we start charging for
                //  using the Neodao contracts, we will switch to OnNep17Payment()
                //  ingress route and will want to validate the funds received.
                //  re-enable this statement then.

                // The only way we know if we actually received the funds is if we
                //  were called by the the expected token contract and if the
                //  the transaction amount received is larger than the tribute.
                //  We can't rely on the tributeOffered variable because that
                //  could have been arbitrarily set by a hostile party.
// paymentSecurityContextObj.ValidateFundsReceived(tributeOffered, tributeToken);

                // Update the token balance for the DAO's ESCROW for the tribute
                //  token type by the amount of the tribute offered.
                daoDetailsObj.ChangeUserTokenBalance(UserTokenBalances.ESCROW_ACCOUNT_ADDRESS, tributeToken, tributeOffered);
            }

            ProposalFlags flags = new ProposalFlags();

            var proposalObj = doSubmitProposal(paymentSecurityContextObj, daoDetailsObj, proposalGuid, applicant, sharesRequested, lootRequested, tributeOffered, tributeToken, paymentRequested, paymentToken, details, flags, strNeoFsIdPairs);

            return proposalObj.ID; // return proposalId - contracts calling submit might want it
        }

        /// <summary>
        /// Gets the current owner of the contract.
        /// </summary>
        /// <return>Returns the current owner of the contract or
        ///     UInt160.Zero if no owner was found.</return>
        private static UInt160 GetContractOwner()
        {
            var rawOwnerVal =  MapOfContractLevelVariables.Get(CLV_CONTRACT_OWNER);

            if (null == rawOwnerVal)
                return UInt160.Zero;

            UInt160 ownerVal = (UInt160)rawOwnerVal;

            return ownerVal;
        }

        /// <summary>
        /// Set the contract owner to the given.
        /// </summary>
        /// <param name="newOwner">The new owner of the contract.</param>
        private static void SetContractOwner(UInt160 newOwner)
        {
            if (MyUtilities.IsEmptyOrInvalidUInt160(newOwner))
                throw new Exception($"({nameof(GetContractOwner)}) The newOwner value is zero.");

            MapOfContractLevelVariables.Put(CLV_CONTRACT_OWNER, (ByteString)newOwner);
        }


       // Stores the address of the person who deployed the contract (they become the "shop
        // owner" and will be allowed to upgrade the shop in the future).

        /// <summary>
        /// 
        /// NOTE: from Hal0x2328 on the Discord as to why owner validation is not required for the Update() method.
        /// 
        ///     "Method names that start with an underscore can't be called by another contract or 
        ///     invoked directly (except _deploy which can only be called by the ContractManagement 
        ///     native contract).   If you tried to bypass that restriction and call the Deploy 
        ///     method of the ContractManagement contract it would throw an exception if the contract 
        ///     already exists. You'd have to call Update() instead, which will set the update flag to 
        ///     true when it calls _deploy for the second time to do the update, and then the smart
        ///     contract will just return without changing anything."
        /// </summary>
        /// <param name="data"></param>
        /// <param name="update"></param>
        [DisplayName("_deploy")]
        public static void Deploy(object data, bool update)
        {
            // string errPrefix = "(PredictionMarketContract.Deploy) ";

            if (update)
            {
                // This is an update call and not the original contract deployment so
                //  there is no need to set the owner since only the original owner
                //  can call the Update() function.  See the summary above for more 
                //  details.
                return;
            }

            // Initial deployment.  Set the contract owner to the sender of the deployment
            //  transaction.
            //
            // Get a reference to the transaction data.
            var tx = (Transaction) Runtime.ScriptContainer;

            // Set the sender's address as the Owner.
            SetContractOwner(tx.Sender);
        }

        /// <summary>
        /// Test method.
        /// </summary>
        /// <param name="Msg">The message to echo.</param>
        /// <returns>Returns the message you sent.</returns>
        [Safe]
        public static ByteString Echo(ByteString Msg)
        {
            return "You said: " + Msg;
        }

        /// <summary>
        /// Return the current version number of this contract.
        /// </summary>
        public static int GetVersionNumber()
        {
            return CURRENT_VERSION;
        }

        public static void Update(ByteString nefFilePath, string manifestFilePath)
        {
            UInt160 ownerVal = GetContractOwner();

            if (!Runtime.CheckWitness(ownerVal)) 
                throw new Exception("Sender is not authorized to update this contract.");

            ContractManagement.Update(nefFilePath, manifestFilePath);
        }        
        // -------------------- END  : SMART CONTRACT -> N3DaoTest --------
    }
}
