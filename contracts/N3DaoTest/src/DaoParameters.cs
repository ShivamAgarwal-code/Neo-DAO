// NOTE: This file was derived from the Apache 2.0 licensed BarnBridgeDAO project:
//
//  https://github.com/BarnBridge/BarnBridge-DAO

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
WARNIGN: This code is not used!  It belongs to the BarnBridge project
 and not DAOHaus.  We are keeping it around so we can be reminded
 of their default values for certain key DAO parameters.
*/

/*
namespace AndroidTechnologies
{

    /// <summary>
    /// This class object groups the parameters that
    ///  control the behavior of a DAO.
    /// </summary>
    public class DaoParameters {

    }

    /// <summary>
    /// This static class acts as a manager class that
    ///  manages the retrieval and storage of the
    ///  DAO parameters, but as a storage group (record)
    ///  with the help of the DaoParameters class.
    /// </summary>
    public static class DaoParametersManager
    {

        // ----------- BEGIN: CONSTANTS ----------
        
        /// <summary>
        /// The default warm-up duration in days.
        /// </summary>
        const int DEFAULT_WARM_UP_DURATION = 4;

        /// <summary>
        /// The default active duration in days.
        /// </summary>
        const int DEFAULT_ACTIVE_DURATION = 4;
        
        /// <summary>
        /// The default queued duration in days.
        /// </summary>
        const int DEFAULT_QUEUE_DURATION = 4;
        
        /// <summary>
        /// The default grace period duration in days.
        /// </summary>
        const int DEFAULT_GRACE_PERIOD_DURATION = 4;
        
        /// <summary>
        /// The default threshold percentage required 
        ///  for proposal acceptance in days.
        /// </summary>
        const int DEFAULT_ACCEPTANCE_THRESHOLD_PERCENT = 60;
        
        /// <summary>
        /// The default minimum threshold percentage required 
        ///  for a quorum.
        /// </summary>
        const int DEFAULT_MINIMUM_QUORUM_THRESHOLD_PERCENT = 40;
        
        /// <summary>
        /// The default ACTIVATION THRESHOLD.
        /// TODO: The original Solidity code had "400_000".
        ///  Make sure that equals 400,000.
        /// </summary>
        const int DEFAULT_ACTIVATION_THRESHOLD = 400_000*10**18;
        
        /// <summary>
        /// The default maximum number of actions
        ///  that are allowed.
        /// </summary>
        const int DEFAULT_MAX_NUMBER_OF_ACTIONS = 10;
        
        // ----------- END  : CONSTANTS ----------

        function setWarmUpDuration(uint256 period) public onlyDAO {
            warmUpDuration = period;
        }

        function setActiveDuration(uint256 period) public onlyDAO {
            require(period >= 4 hours, "period must be > 0");
            activeDuration = period;
        }

        function setQueueDuration(uint256 period) public onlyDAO {
            queueDuration = period;
        }

        function setGracePeriodDuration(uint256 period) public onlyDAO {
            require(period >= 4 hours, "period must be > 0");
            gracePeriodDuration = period;
        }

        function setAcceptanceThreshold(uint256 threshold) public onlyDAO {
            require(threshold <= 100, "Maximum is 100.");
            require(threshold > 50, "Minimum is 50.");

            acceptanceThreshold = threshold;
        }

        function setMinQuorum(uint256 quorum) public onlyDAO {
    require(quorum > 5, "quorum must be greater than 5");
    require(quorum <= 100, "Maximum is 100.");

    minQuorum = quorum;
    }
}
*/