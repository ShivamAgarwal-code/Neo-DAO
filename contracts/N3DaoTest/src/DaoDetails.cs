using System;
using System.ComponentModel;
using System.Numerics;
using Neo;
using Neo.SmartContract.Framework;
// using Neo.SmartContract.Framework.Attributes;
using Neo.SmartContract.Framework.Native;
using Neo.SmartContract.Framework.Services;

#nullable enable

/**
    This file contains the DaoDetails object, the object that contains
    the settings and other details for a NeoDao DAO.
*/

namespace AndroidTechnologies
{

    /// <summary>
    /// This object is a summary of a DAO details object.  It is used when
    ///  passing data back to client side calls for information on a 
    ///  particular DAO.
    /// </summary>
    public class DaoSummary
    {
        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="daoDetailsObj">A valid DAO details object.</param>
        public DaoSummary(DaoDetails daoDetailsObj)
        {
            if (daoDetailsObj == null)
                throw new Exception($"({nameof(DaoSummary)}) The DAO details object is unassigned.");

            this.ID = (int) daoDetailsObj.SequenceNumber;
            this.DisplayName = daoDetailsObj.DisplayName;
            this.MembershipFee = (int) daoDetailsObj.MembershipFee;
            this.ProposalDeposit = (int) daoDetailsObj.ProposalDeposit;
            this.ProcessingReward = (int) daoDetailsObj.ProcessingReward;
        }

        public int ID = default!;
        public int ProposalDeposit = default!;
        public int ProcessingReward = default!;
        public string DisplayName = default!;
        public int MembershipFee = default!;

    }

    /// <summary>
    /// This class holds the details for a particular DAO.
    /// </summary>
    public class DaoDetails
    {
        // --------------------- CONSTANTS --------------------

        // WARNING!: Keep these values and the constants of the same name
        //  in the client side dApp code in sync!

        // Hard-coded limits.
        public const ulong MAX_VOTING_PERIOD_LENGTH = 10000000000000000000; // Math.Pow(10, 18);
        public const ulong MAX_GRACE_PERIOD_LENGTH = 10000000000000000000;
        public const ulong MAX_DILUTION_BOUND = 10000000000000000000;
        public const ulong MAX_NUMBER_OF_SHARES_AND_LOOT = 10000000000000000000;
        public const int MAX_TOKEN_WHITELIST_COUNT = 400;
        public const int MAX_TOKEN_GUILDBANK_COUNT = 200;

        /// <summary>
        /// Constructor.
        /// </summary>
        public DaoDetails()
        {
        }

        // ---------------------------- PROPERTIES ----------------------

        public BigInteger ProposalCount = 0; // total proposals submitted
        public BigInteger TotalShares = 0; // total shares across all members
        public BigInteger TotalLoot = 0; // total loot across all members

        public BigInteger TotalGuildBankTokens = 0; // total tokens with non-zero balance in guild bank

        const string GUILD = "GUILD";
        const string ESCROW = "ESCROW";
        const string TOTAL = "TOTAL";

        // -------------------------------- DATA MEMBERS --------------------

        /// <summary>
        /// This is the ordinal position of the DAO in the sequence
        ///  of DAOs across all time.  In other words if it is 1,
        ///  then it is the first DAO ever created.  If the value
        ///  is zero, then we know that it a bad DAO details object
        ///  because we increment the contract level variable that
        ///  counts the number of DAOs created BEFORE we assign
        ///  a sequence number to a newly created DAO object.
        /// </summary>
        public BigInteger SequenceNumber = 0;

        public UInt160 OwnerAddress = default!; // The owner of this DAO.

        // public ByteString ID = default!; // The ID used to access this DAO (i.e. - the DAO GUID)
        public ByteString DisplayName = default!; // The friendly name shown to users who use the DAO.

        // -------------------- BEGIN: DAO SETTINGS -----------

        public BigInteger DilutionBound = 3; // default = 3. The maximum multiplier a YES voter will be obligated to pay in case of mass ragequit
        public BigInteger GracePeriodLength = 35; // default = 35 periods (7 days)
        public BigInteger PeriodDuration = 17280; // default!; // default = 17280 = 4.8 hours in seconds (5 periods per day)
        public BigInteger ProposalDeposit = 10; // default = 10 of the depost tokens
        public BigInteger ProcessingReward = 1; // default = 1. The amount of the default token to give to whoever processes a proposal
        public BigInteger MembershipFee = 0; // default = 0. The number of shares required to be a member.  For DAOs that don't want tor require a proposal to add a member.
        public BigInteger MinSummonerShares = 0; // default = 0. If the DAO is GRANT related, this is the minimum number of shares for a summoner to have to be part of the DAO.
        public BigInteger VotingPeriodLength = 35; // default = 35 periods (7 days)

        // -------------------- END  : DAO SETTINGS -----------

        public BigInteger SummoningTime = MyUtilities.GetReferenceDateTime(); // Default is "now".  This is needed to determine the current period

        public bool Initialized = default!; // Set to TRUE after this object has been initialized properly.

        public UInt160 DepositToken = default!;   // deposit token contract hash (E.g. - GAS or NEO) = default!; 

        public List<UInt160> ApprovedTokens = new List<UInt160>(); // The tokens allowed for use in this DAO.

        public Map<UInt160, bool> TokenWhiteList = new Map<UInt160, bool>(); // The list of whitelisted tokens.  The key is the token contract hash, and the value is TRUE for whitelisted, FALSE if not.

        public Map<UInt160, MemberDetails> Members = new Map<UInt160, MemberDetails>(); // The members of this DAO.

        public Map<UInt160, UInt160> MemberAddressByDelegateKey = new Map<UInt160, UInt160>();

        /// <summary>
        /// Retrieve the token balance for a particular user, and a
        ///  particular token.
        /// </summary>
        /// <param name="userAddress">The user's address</param>
        /// <param name="tokenContracHash">The contract hash for the the
        ///  desired token.</param>
        /// <returns>Returns the token balance for the given user and
        ///   the given token, or zero if neither is found.</returns>
        public BigInteger GetUserTokenBalance(UInt160 userAddress, UInt160 tokenContracHash)
        {
            return UserTokenBalances.GetUserTokenBalance(this, userAddress, tokenContracHash);
        }

        /// <summary>
        /// Retrieve the token balance for a particular user, and a
        ///  particular token, within the storage context of the
        ///  given DAO.
        /// </summary>
        /// <param name="daoDetailsObj">The DAO details object 
        ///  the operation is being performed for.
        /// <param name="userAddress">The user's address</param>
        /// <param name="tokenContracHash">The contract hash for the the
        ///  desired token.</param>
        /// <param name="newBalance">The new balance for the token.</param>
        public void PutUserTokenBalance(DaoDetails daoDetailsObj, UInt160 userAddress, UInt160 tokenContracHash, BigInteger newBalance)
        {
            UserTokenBalances.PutUserTokenBalance(this, userAddress, tokenContracHash, newBalance);
        }

        /// <summary>
        /// Change the current token balance for the given 
        ///  user, token combination by the amount specified.
        ///  (relative change based on existing value.)
        /// </summary>
        /// <param name="userAddress">The user's address</param>
        /// <param name="tokenContractHash">The contract hash for the the
        ///  desired token.</param>
        /// <param name="deltaBalance">The amount to change
        ///  the token balance by.</param>
        public void ChangeUserTokenBalance(UInt160 userAddress, UInt160 tokenContractHash, BigInteger deltaBalance)
        {
            UserTokenBalances.ChangeUserTokenBalance(this, userAddress, tokenContractHash, deltaBalance);
        }

        /// <summary>
        /// Retrieve the proposal details object for this DAO.
        /// </summary>
        /// <param name="proposalID">A valid proposal ID.</param>
        /// 
        /// <returns> Returns the proposal details object associated
        ///  with the given ID.  NULL if none exists with that ID.
        public ProposalDetails GetProposalDetails(ByteString proposalID)
        {
            return ProposalDetailsRegistry.GetProposalDetails(this, proposalID);
        }

        /// <summary>
        /// Store a proposal details object for a particular DAO.
        /// </summary>
        /// <param name="daoDetailsObj">The DAO details object 
        ///  the operation is being performed for.
        /// <param name="proposalDetailsObj">A valid proposal details object.</param>
        public void PutProposalDetails(ProposalDetails proposalDetailsObj)
        {
            ProposalDetailsRegistry.PutProposalDetails(this, proposalDetailsObj);
        }

        /// <summary>
        /// Get all the proposals that belong to this DAO.
        /// </summary>
        /// 
        /// <returns>Returns a list of ProposalDetails objects with
        ///  all the proposals submitted to this DAO.</returns>
        public List<ProposalDetails> GetAllProposals()
        {
            return ProposalDetailsRegistry.GetAllDaoProposals(this);
        }

        /// <summary>
        /// This method checks to see if the given address belongs
        ///  to a member that was jailed.
        /// </summary>
        /// <param name="theAddress">The address to check.</param>
        /// 
        /// <returns>Returns TRUE if, and only if, the address
        ///  is found in this DAO's member list AND they were
        ///  jailed.  If either of those conditions is FALSE,
        ///  then FALSE is returned.</returns>
        /// <exception cref="Exception"></exception>
        public bool IsMemberAndJailed(UInt160 theAddress)
        {
            if (MyUtilities.IsEmptyOrInvalidUInt160(theAddress))
                throw new Exception($"({nameof(IsMemberAndJailed)}) The theAddress parameter is empty.");

            if (this.Members.HasKey(theAddress))
                return this.Members[theAddress].isJailed;

            return false;
        }

    /// <summary>
    /// Validates our content.  Throws an exception if any of our
    ///     fields are invalid, otherwise it just returns.
    /// </summary>
    /// <param name="callerName">The name of the calling function."</param>
    public void ValidateOrDie(string callerName)
        {
            if ("" == callerName)
                throw new Exception($"({nameof(ValidateOrDie)}) The caller name is empty.");

            if (!this.Initialized)
                throw new Exception($"({callerName}) This DAO has not been initialized");

            if (0 == this.SequenceNumber)
                throw new Exception($"({callerName}) This DAO sequence number is zero.");

            if (0 > this.SequenceNumber)
                throw new Exception($"({callerName}) This DAO sequence number is negative.");

            if (MyUtilities.IsEmptyOrInvalidUInt160(this.OwnerAddress))
                throw new Exception($"({callerName}) This DAO owner has not been set");

            // if ("" == this.ID)
            //    throw new Exception($"({callerName}) This ID is empty");

            if ("" == this.DisplayName)
                throw new Exception($"({callerName}) This display name is empty");

            if (MyUtilities.IsEmptyOrInvalidUInt160(this.DepositToken))
                throw new Exception($"({callerName}) This depositToken is not set");

            if (!(this.DilutionBound > 0))
                throw new Exception($"({callerName}) dilutionBound cannot be 0");

            if (!(this.DilutionBound <= MAX_DILUTION_BOUND))
                throw new Exception($"({callerName}) dilutionBound exceeds limit");

            if (!(this.GracePeriodLength <= MAX_GRACE_PERIOD_LENGTH))
                throw new Exception($"({callerName}) gracePeriodLength exceeds limit");

            if (!(this.ApprovedTokens.Count > 0))
                throw new Exception($"({callerName}) need at least one approved token");

            if (!(this.ApprovedTokens.Count <= MAX_TOKEN_WHITELIST_COUNT))
                throw new Exception($"({callerName}) too many tokens");

            if (!(this.MembershipFee >= 0))
                throw new Exception($"({callerName}) membershipFee is negative");

            if (!(this.MembershipFee <= MAX_NUMBER_OF_SHARES_AND_LOOT))
                throw new Exception($"({callerName}) membershipFee is too large");

            if (!(this.MinSummonerShares >= 0))
                throw new Exception($"({callerName}) minSummonerShares is negative");

            if (!(this.PeriodDuration > 0))
                throw new Exception($"({callerName}) periodDuration must be greater than 0");

            if (!(this.ProposalDeposit >= 0))
                throw new Exception($"({callerName}) proposalDeposit is negative");

            if (!(this.ProcessingReward >= 0))
                throw new Exception($"({callerName}) processingReward is negative");

            // TODO: Remove these statements.
            // var theProposalDeposit = this.ProposalDeposit;
            // var theProcessingReward = this.ProcessingReward;

            if (!(this.ProposalDeposit > this.ProcessingReward))
                throw new Exception($"({callerName}) proposalDeposit cannot be smaller than processingReward");

            if (!(this.MinSummonerShares >= 0))
                throw new Exception($"({callerName}) minSummonerShares is negative");

            if (!(this.MinSummonerShares <= MAX_NUMBER_OF_SHARES_AND_LOOT))
                throw new Exception($"({callerName}) minSummonerShares is too large");

            if (!(this.VotingPeriodLength > 0))
                throw new Exception($"({callerName}) votingPeriodLength cannot be 0");

            if (!(this.VotingPeriodLength <= MAX_VOTING_PERIOD_LENGTH))
                throw new Exception($"({callerName}) votingPeriodLength exceeds limit");

            // Content validated.
        }

        /// <summary>
        /// Call this method after create a new DaoDetails object.  It will
        ///  create the derived field and variable values.
        /// </summary>
        /// <param name="_summoner">An array of summer addresses</param>
        /// <param name="_summonerShares">An array containing how many
        ///  shares each summmoner has volunteered</param>
        /// <param name="_approvedTokens">An array of the hash scripts
        ///  for the smart contracts belonging to the tokens approved
        ///  for use with this DAO.  WARNING: The default token 
        ///  (i.e. - the deposit token), MUST be in the first
        ///  slot of the array!</param>
        public void init(UInt160[] _summoner, BigInteger[] _summonerShares, UInt160[] _approvedTokens)
        {

            if (_summoner.Length < 1)
                throw new Exception($"({nameof(init)}) The _summoner array is empty.");
            if (_summonerShares.Length < 1)
                throw new Exception($"({nameof(init)}) The _summonerShares array is empty.");
            // The summoner and the summoner shares arrays must be of the same length.
            if (_summoner.Length != _summonerShares.Length)
                throw new Exception($"({nameof(init)}) The length of the _summoner array({_summoner.Length.ToString()}) does not match the length of the _summonerShares array: {_summonerShares.Length.ToString()}");
            if (_approvedTokens.Length < 1)
                throw new Exception($"({nameof(init)}) The _approvedTokens array is empty.");

            // Validate the summoners array and store its contents.
            // The other validation checks will be done by the DaoDetails object we created.
            for (var i = 0; i < _summoner.Length; i++)
            {
                if (MyUtilities.IsEmptyOrInvalidUInt160(_summoner[i]))
                    throw new Exception($"({nameof(init)}) The address for summoner #{i.ToString()} is not set.");

                // Create a new member object and add it to our collection.
                this.Members[_summoner[i]] = new MemberDetails(_summoner[i], true, 0, false, 0, _summonerShares[i]);
                // _summoner[i], _summonerShares[i], 0, true, 0, 0);

                // Make the summoner their own delegate by default.
                this.MemberAddressByDelegateKey[_summoner[i]] = _summoner[i];

                // Track the total "shares" allocated to this contract by
                //  the summoners.
                this.TotalShares = this.TotalShares += _summonerShares[i];
            }

            if (!(TotalShares <= MAX_NUMBER_OF_SHARES_AND_LOOT))
                throw new Exception($"({nameof(init)}) too many shares requested");


            /*
                TODO: For the Polaris hackathon, only NEO and GAS tokens are allowed
                    Later fully enable the token whitelisting feature.  Tokens are
                    whitelistd via DAO proposals.
            // Process the approved tokens list.
            for (var i = 0; i < _approvedTokens.Length; i++) {
                // We must have a valid script hash for each token the DAO
                //  will utilize.
                if (MyUtilities.IsEmptyString(_approvedTokens[i]))
                    throw new Exception($"({nameof(init)}) Found an empty approved token slot");

                if (!this.TokenWhiteList[_approvedTokens[i]])
                    throw new Exception($"({nameof(init)}) duplicate approved token: {_approvedTokens[i]}");


                this.TokenWhiteList[_approvedTokens[i]] = true;
                this.ApprovedTokens.Add(_approvedTokens[i]);
            }            
            */

            // TODO: However, hackathon or not, we do have to add the
            //  NEO and GAS tokens to the approved tokens list, to
            //  pass object validation attempts.
            for (var i = 0; i < _approvedTokens.Length; i++)
                this.ApprovedTokens.Add(_approvedTokens[i]);

            // We whitelist them too automatically.
            for (var i = 0; i < _approvedTokens.Length; i++)
                this.TokenWhiteList[_approvedTokens[i]] = true;

            // Mark this object as properly initialized now.
            this.Initialized = true;
        }
    }
}